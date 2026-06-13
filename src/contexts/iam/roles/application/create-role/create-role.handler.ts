import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { EntityAlreadyExistsException } from '@shared/exceptions';
import { TenantId } from '@shared/domain/types';
import { Role } from '../../domain/entities/role.entity';
import {
  ROLE_REPOSITORY,
  RoleRepository,
} from '../../domain/repositories/role.repository';
import { CreateRoleCommand } from './create-role.command';

@CommandHandler(CreateRoleCommand)
export class CreateRoleHandler implements ICommandHandler<CreateRoleCommand> {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateRoleCommand): Promise<{ id: string }> {
    const name = command.name.trim().toUpperCase();
    const tenantId = TenantId(command.tenantId);
    const existing = await this.roleRepository.findByName(name, tenantId);
    if (existing) {
      throw new EntityAlreadyExistsException('Role', 'name', name);
    }

    const role = Role.create(
      command.tenantId,
      command.name,
      command.description ?? null,
    );
    const events = role.pullDomainEvents();
    await this.roleRepository.save(role, events);
    this.eventBus.publishAll(events);
    return { id: role.id };
  }
}
