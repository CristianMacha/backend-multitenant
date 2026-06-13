import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import {
  TENANT_REPOSITORY,
  TenantRepository,
} from '../../domain/repositories/tenant.repository';
import { UpdateTenantCommand } from './update-tenant.command';

@CommandHandler(UpdateTenantCommand)
export class UpdateTenantHandler implements ICommandHandler<UpdateTenantCommand> {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpdateTenantCommand): Promise<void> {
    const tenant = await this.tenantRepository.findById(command.id);
    if (!tenant) throw new EntityNotFoundException('Tenant', command.id);

    tenant.update(command.changes);
    const events = tenant.pullDomainEvents();
    await this.tenantRepository.save(tenant, events);
    this.eventBus.publishAll(events);
  }
}
