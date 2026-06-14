import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { TenantId } from '@shared/domain/types';
import { CrmSettings } from '../../domain/entities/crm-settings.entity';
import {
  CRM_SETTINGS_REPOSITORY,
  CrmSettingsRepository,
} from '../../domain/repositories/crm-settings.repository';
import { UpsertCrmSettingsCommand } from './upsert-crm-settings.command';

@CommandHandler(UpsertCrmSettingsCommand)
export class UpsertCrmSettingsHandler implements ICommandHandler<UpsertCrmSettingsCommand> {
  constructor(
    @Inject(CRM_SETTINGS_REPOSITORY)
    private readonly repo: CrmSettingsRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: UpsertCrmSettingsCommand): Promise<void> {
    const tenantId = TenantId(command.tenantId);
    let settings = await this.repo.findByTenantId(tenantId);

    if (!settings) {
      settings = CrmSettings.create(
        tenantId,
        command.defaultCurrency,
        command.timezone,
      );
    } else {
      settings.update({
        defaultCurrency: command.defaultCurrency,
        timezone: command.timezone,
      });
    }

    const events = settings.pullDomainEvents();
    await this.repo.save(settings, events);
    this.eventBus.publishAll(events);
  }
}
