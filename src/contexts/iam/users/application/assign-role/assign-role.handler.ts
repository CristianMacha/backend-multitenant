import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { RoleId, TenantId, UserId } from '@shared/domain/types';
import { EntityNotFoundException } from '@shared/exceptions';
import { assertCanGrantPermissions } from '@shared/authorization/privilege-escalation';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  USER_REPOSITORY,
  UserRepository,
} from '../../domain/repositories/user.repository';
import { AssignRoleCommand } from './assign-role.command';

@CommandHandler(AssignRoleCommand)
export class AssignRoleHandler implements ICommandHandler<AssignRoleCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: AssignRoleCommand): Promise<void> {
    const tenantId = TenantId(command.tenantId);

    const user = await this.userRepository.findById(
      UserId(command.userId),
      tenantId,
    );
    if (!user) throw new EntityNotFoundException('User', command.userId);

    const role = await this.prisma.role.findFirst({
      where: { id: command.roleId, tenantId, deletedAt: null },
      include: { rolePermissions: { include: { permission: true } } },
    });
    if (!role) throw new EntityNotFoundException('Role', command.roleId);

    // Prevent escalation: the actor cannot grant a role that carries
    // permissions they do not hold themselves.
    assertCanGrantPermissions(
      role.rolePermissions.map((rp) => rp.permission.code),
    );

    user.assignRole(RoleId(command.roleId));
    const events = user.pullDomainEvents();
    await this.userRepository.save(user, events);
    this.eventBus.publishAll(events);
  }
}
