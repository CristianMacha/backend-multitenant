import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { RoleId, TenantId } from '@shared/domain/types';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { assertCanGrantPermissions } from '@shared/authorization/privilege-escalation';
import {
  ROLE_REPOSITORY,
  RoleRepository,
} from '../../domain/repositories/role.repository';
import { SetRolePermissionsCommand } from './set-role-permissions.command';

@CommandHandler(SetRolePermissionsCommand)
export class SetRolePermissionsHandler implements ICommandHandler<SetRolePermissionsCommand> {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: SetRolePermissionsCommand): Promise<void> {
    const role = await this.roleRepository.findById(
      RoleId(command.id),
      TenantId(command.tenantId),
    );
    if (!role) throw new EntityNotFoundException('Role', command.id);

    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: command.permissionIds }, deletedAt: null },
      select: { code: true },
    });
    if (permissions.length !== command.permissionIds.length) {
      throw new EntityNotFoundException(
        'Permission',
        'one or more of the provided ids',
      );
    }

    // Prevent escalation: the actor cannot widen a role beyond their own
    // permissions. The domain entity already blocks editing system roles.
    assertCanGrantPermissions(permissions.map((p) => p.code));

    role.setPermissions(command.permissionIds);
    const events = role.pullDomainEvents();
    await this.roleRepository.save(role, events);
    this.eventBus.publishAll(events);
  }
}
