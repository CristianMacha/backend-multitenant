import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CRM_SETTINGS_REPOSITORY } from './domain/repositories/crm-settings.repository';
import { GetCrmSettingsHandler } from './application/get-crm-settings/get-crm-settings.handler';
import { UpsertCrmSettingsHandler } from './application/upsert-crm-settings/upsert-crm-settings.handler';
import { PrismaCrmSettingsRepository } from './infrastructure/repositories/prisma-crm-settings.repository';
import { CrmSettingsController } from './presentation/controllers/crm-settings.controller';

@Module({
  imports: [CqrsModule],
  controllers: [CrmSettingsController],
  providers: [
    GetCrmSettingsHandler,
    UpsertCrmSettingsHandler,
    { provide: CRM_SETTINGS_REPOSITORY, useClass: PrismaCrmSettingsRepository },
  ],
})
export class SettingsModule {}
