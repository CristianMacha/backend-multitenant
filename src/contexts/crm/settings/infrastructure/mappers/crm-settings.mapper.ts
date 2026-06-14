import { CrmSettings as PrismaCrmSettings } from '@prisma/client';
import { TenantId } from '@shared/domain/types';
import { CrmSettings } from '../../domain/entities/crm-settings.entity';

export class CrmSettingsMapper {
  static toDomain(row: PrismaCrmSettings): CrmSettings {
    return CrmSettings.fromPersistence({
      id: row.id,
      tenantId: TenantId(row.tenantId),
      defaultCurrency: row.defaultCurrency,
      timezone: row.timezone,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    });
  }

  static toPersistence(
    settings: CrmSettings,
  ): Omit<PrismaCrmSettings, 'createdAt' | 'updatedAt'> {
    return {
      id: settings.id,
      tenantId: settings.tenantId,
      defaultCurrency: settings.defaultCurrency,
      timezone: settings.timezone,
      deletedAt: settings.deletedAt,
    };
  }
}
