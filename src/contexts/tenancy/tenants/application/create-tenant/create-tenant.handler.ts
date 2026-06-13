import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { EntityAlreadyExistsException } from '@shared/exceptions';
import { Tenant } from '../../domain/entities/tenant.entity';
import {
  TENANT_REPOSITORY,
  TenantRepository,
} from '../../domain/repositories/tenant.repository';
import { CreateTenantCommand } from './create-tenant.command';

@CommandHandler(CreateTenantCommand)
export class CreateTenantHandler implements ICommandHandler<CreateTenantCommand> {
  constructor(
    @Inject(TENANT_REPOSITORY)
    private readonly tenantRepository: TenantRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateTenantCommand): Promise<{ id: string }> {
    const existing = await this.tenantRepository.findBySlug(command.slug);
    if (existing) {
      throw new EntityAlreadyExistsException('Tenant', 'slug', command.slug);
    }

    const tenant = Tenant.create(command.name, command.slug);
    const events = tenant.pullDomainEvents();
    await this.tenantRepository.save(tenant, events);
    this.eventBus.publishAll(events);

    return { id: tenant.id };
  }
}
