import {
  CommandHandler,
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
  CreateTenantCommand,
  DeleteTenantCommand,
  UpdateTenantCommand,
} from '../commands/tenant.commands';
import {
  GetTenantByIdQuery,
  GetTenantsQuery,
  TenantReadModel,
} from '../queries/tenant.queries';

const toReadModel = (tenant: {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}): TenantReadModel => ({
  id: tenant.id,
  name: tenant.name,
  slug: tenant.slug,
  isActive: tenant.isActive,
  createdAt: tenant.createdAt,
  updatedAt: tenant.updatedAt,
});

@CommandHandler(CreateTenantCommand)
export class CreateTenantHandler implements ICommandHandler<CreateTenantCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateTenantCommand): Promise<{ id: string }> {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: command.slug },
    });
    if (existing) {
      throw new EntityAlreadyExistsException('Tenant', 'slug', command.slug);
    }
    const tenant = await this.prisma.tenant.create({
      data: { name: command.name, slug: command.slug },
    });
    return { id: tenant.id };
  }
}

@CommandHandler(UpdateTenantCommand)
export class UpdateTenantHandler implements ICommandHandler<UpdateTenantCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: UpdateTenantCommand): Promise<void> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: command.id, deletedAt: null },
    });
    if (!tenant) throw new EntityNotFoundException('Tenant', command.id);

    await this.prisma.tenant.update({
      where: { id: command.id },
      data: command.changes,
    });
  }
}

@CommandHandler(DeleteTenantCommand)
export class DeleteTenantHandler implements ICommandHandler<DeleteTenantCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: DeleteTenantCommand): Promise<void> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: command.id, deletedAt: null },
    });
    if (!tenant) throw new EntityNotFoundException('Tenant', command.id);

    await this.prisma.tenant.update({
      where: { id: command.id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}

@QueryHandler(GetTenantByIdQuery)
export class GetTenantByIdHandler implements IQueryHandler<GetTenantByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetTenantByIdQuery): Promise<TenantReadModel> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: query.id, deletedAt: null },
    });
    if (!tenant) throw new EntityNotFoundException('Tenant', query.id);
    return toReadModel(tenant);
  }
}

@QueryHandler(GetTenantsQuery)
export class GetTenantsHandler implements IQueryHandler<GetTenantsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    query: GetTenantsQuery,
  ): Promise<PaginatedResultDto<TenantReadModel>> {
    const where: Prisma.TenantWhereInput = {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [tenants, total] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return PaginatedResultDto.of(
      tenants.map(toReadModel),
      total,
      query.page,
      query.limit,
    );
  }
}
