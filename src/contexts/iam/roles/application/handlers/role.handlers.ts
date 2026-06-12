import { Inject } from '@nestjs/common';
import {
  CommandHandler,
  EventBus,
  ICommandHandler,
  IQueryHandler,
  QueryHandler,
} from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import {
  EntityAlreadyExistsException,
  EntityNotFoundException,
} from '@shared/exceptions';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { PaginatedResultDto } from '@shared/presentation/dto/pagination.dto';
import {
  CreateRoleCommand,
  DeleteRoleCommand,
  SetRolePermissionsCommand,
  UpdateRoleCommand,
} from '../commands/role.commands';
import {
  GetRoleByIdQuery,
  GetRolesQuery,
  RoleReadModel,
} from '../queries/role.queries';
import { Role } from '../../domain/entities/role.entity';
import {
  ROLE_REPOSITORY,
  RoleRepository,
} from '../../domain/repositories/role.repository';

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateRoleCommand): Promise<{ id: string }> {
    const name = command.name.trim().toUpperCase();
    const existing = await this.roleRepository.findByName(
      name,
      command.tenantId,
    );
    if (existing) {
      throw new EntityAlreadyExistsException('Role', 'name', name);
    }

    const role = Role.create(
      command.tenantId,
      command.name,
      command.description ?? null,
    );
    await this.roleRepository.save(role);
    this.eventBus.publishAll(role.pullDomainEvents());
    return { id: role.id };
  }
}

@CommandHandler(UpdateRoleCommand)
export class UpdateRoleHandler implements ICommandHandler<UpdateRoleCommand> {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateRoleCommand): Promise<void> {
    const role = await this.roleRepository.findById(
      command.id,
      command.tenantId,
    );
    if (!role) throw new EntityNotFoundException('Role', command.id);

    role.update(command.changes);
    await this.roleRepository.save(role);
    this.eventBus.publishAll(role.pullDomainEvents());
  }
}

@CommandHandler(DeleteRoleCommand)
export class DeleteRoleHandler implements ICommandHandler<DeleteRoleCommand> {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteRoleCommand): Promise<void> {
    const role = await this.roleRepository.findById(
      command.id,
      command.tenantId,
    );
    if (!role) throw new EntityNotFoundException('Role', command.id);

    role.delete();
    await this.roleRepository.save(role);
    this.eventBus.publishAll(role.pullDomainEvents());
  }
}

@CommandHandler(SetRolePermissionsCommand)
export class SetRolePermissionsHandler implements ICommandHandler<SetRolePermissionsCommand> {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: SetRolePermissionsCommand): Promise<void> {
    const role = await this.roleRepository.findById(
      command.id,
      command.tenantId,
    );
    if (!role) throw new EntityNotFoundException('Role', command.id);

    const found = await this.prisma.permission.count({
      where: { id: { in: command.permissionIds }, deletedAt: null },
    });
    if (found !== command.permissionIds.length) {
      throw new EntityNotFoundException(
        'Permission',
        'one or more of the provided ids',
      );
    }

    role.setPermissions(command.permissionIds);
    await this.roleRepository.save(role);
    this.eventBus.publishAll(role.pullDomainEvents());
  }
}

const toReadModel = (role: {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  rolePermissions: { permission: { code: string } }[];
}): RoleReadModel => ({
  id: role.id,
  tenantId: role.tenantId,
  name: role.name,
  description: role.description,
  isSystem: role.isSystem,
  permissions: role.rolePermissions.map(
    (rolePermission) => rolePermission.permission.code,
  ),
  createdAt: role.createdAt,
  updatedAt: role.updatedAt,
});

@QueryHandler(GetRoleByIdQuery)
export class GetRoleByIdHandler implements IQueryHandler<GetRoleByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetRoleByIdQuery): Promise<RoleReadModel> {
    const role = await this.prisma.role.findFirst({
      where: { id: query.id, tenantId: query.tenantId, deletedAt: null },
      include: { rolePermissions: { include: { permission: true } } },
    });
    if (!role) throw new EntityNotFoundException('Role', query.id);
    return toReadModel(role);
  }
}

@QueryHandler(GetRolesQuery)
export class GetRolesHandler implements IQueryHandler<GetRolesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    query: GetRolesQuery,
  ): Promise<PaginatedResultDto<RoleReadModel>> {
    const where: Prisma.RoleWhereInput = {
      tenantId: query.tenantId,
      deletedAt: null,
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [roles, total] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        where,
        include: { rolePermissions: { include: { permission: true } } },
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.role.count({ where }),
    ]);

    return PaginatedResultDto.of(
      roles.map(toReadModel),
      total,
      query.page,
      query.limit,
    );
  }
}
