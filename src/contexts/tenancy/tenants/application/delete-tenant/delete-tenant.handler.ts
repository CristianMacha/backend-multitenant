import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import {
  TENANT_REPOSITORY,
  TenantRepository,
} from '../../domain/repositories/tenant.repository';
import { DeleteTenantCommand } from './delete-tenant.command';

@CommandHandler(DeleteTenantCommand)
export class DeleteTenantHandler implements ICommandHandler<DeleteTenantCommand> {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteTenantCommand): Promise<void> {
    const tenant = await this.tenantRepository.findById(command.id);
    if (!tenant) throw new EntityNotFoundException('Tenant', command.id);

    tenant.delete();
    const events = tenant.pullDomainEvents();
    await this.tenantRepository.save(tenant, events);
    this.eventBus.publishAll(events);
  }
}
