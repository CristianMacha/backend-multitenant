import { TenantId } from '@shared/domain/types';
import { CrmSettings } from '../../domain/entities/crm-settings.entity';
import { CrmSettingsMapper } from './crm-settings.mapper';

const makeRaw = () => ({
  id: 'settings-1',
  tenantId: 'tenant-1',
  defaultCurrency: 'EUR',
  timezone: 'Europe/Paris',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  deletedAt: null,
});

describe('CrmSettingsMapper', () => {
  describe('toDomain', () => {
    it('maps prisma row to CrmSettings aggregate', () => {
      const settings = CrmSettingsMapper.toDomain(makeRaw());
      expect(settings.defaultCurrency).toBe('EUR');
      expect(settings.timezone).toBe('Europe/Paris');
    });
  });

  describe('toPersistence', () => {
    it('maps CrmSettings aggregate to persistence shape', () => {
      const settings = CrmSettings.create(TenantId('tenant-1'), 'USD', 'UTC');
      settings.pullDomainEvents();
      const row = CrmSettingsMapper.toPersistence(settings);
      expect(row.defaultCurrency).toBe('USD');
      expect(row.timezone).toBe('UTC');
      expect(row.tenantId).toBe('tenant-1');
    });
  });
});
