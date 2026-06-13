import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { RoleId, TenantId } from '@shared/domain/types';
import {
  ROLE_REPOSITORY,
  RoleRepository,
} from '../../domain/repositories/role.repository';
import { UpdateRoleCommand } from './update-role.command';

@CommandHandler(UpdateRoleCommand)
export class UpdateRoleHandler implements ICommandHandler<UpdateRoleCommand> {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateRoleCommand): Promise<void> {
    const role = await this.roleRepository.findById(
      RoleId(command.id),
      TenantId(command.tenantId),
    );
    if (!role) throw new EntityNotFoundException('Role', command.id);

    role.update(command.changes);
    const events = role.pullDomainEvents();
    await this.roleRepository.save(role, events);
    this.eventBus.publishAll(events);
  }
}
