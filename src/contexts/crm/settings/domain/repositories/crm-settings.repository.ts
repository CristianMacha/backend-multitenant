import { DomainEvent } from '@shared/domain/domain-event.base';
import { TenantId } from '@shared/domain/types';
import { CrmSettings } from '../entities/crm-settings.entity';

export const CRM_SETTINGS_REPOSITORY = Symbol('CRM_SETTINGS_REPOSITORY');

export interface CrmSettingsRepository {
  findByTenantId(tenantId: TenantId): Promise<CrmSettings | null>;
  save(settings: CrmSettings, outboxEvents?: DomainEvent[]): Promise<void>;
}
