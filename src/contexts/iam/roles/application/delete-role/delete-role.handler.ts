import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { RoleId, TenantId } from '@shared/domain/types';
import {
  ROLE_REPOSITORY,
  RoleRepository,
} from '../../domain/repositories/role.repository';
import { DeleteRoleCommand } from './delete-role.command';

@CommandHandler(DeleteRoleCommand)
export class DeleteRoleHandler implements ICommandHandler<DeleteRoleCommand> {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteRoleCommand): Promise<void> {
    const role = await this.roleRepository.findById(
      RoleId(command.id),
      TenantId(command.tenantId),
    );
    if (!role) throw new EntityNotFoundException('Role', command.id);

    role.delete();
    const events = role.pullDomainEvents();
    await this.roleRepository.save(role, events);
    this.eventBus.publishAll(events);
  }
}
