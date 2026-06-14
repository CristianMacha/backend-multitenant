import { TenantId } from '@shared/domain/types';
import { CrmSettings } from './crm-settings.entity';

describe('CrmSettings', () => {
  describe('create', () => {
    it('creates with provided values', () => {
      const s = CrmSettings.create(TenantId('tenant-1'), 'EUR', 'Europe/Paris');
      expect(s.defaultCurrency).toBe('EUR');
      expect(s.timezone).toBe('Europe/Paris');
    });

    it('creates with defaults when values not provided', () => {
      const s = CrmSettings.create(TenantId('tenant-1'));
      expect(s.defaultCurrency).toBe('USD');
      expect(s.timezone).toBe('UTC');
    });
  });

  describe('update', () => {
    it('updates defaultCurrency when provided', () => {
      const s = CrmSettings.create(TenantId('tenant-1'));
      s.pullDomainEvents();
      s.update({ defaultCurrency: 'GBP' });
      expect(s.defaultCurrency).toBe('GBP');
      expect(s.timezone).toBe('UTC');
      expect(s.pullDomainEvents()).toHaveLength(1);
    });

    it('updates timezone when provided', () => {
      const s = CrmSettings.create(TenantId('tenant-1'));
      s.pullDomainEvents();
      s.update({ timezone: 'America/New_York' });
      expect(s.timezone).toBe('America/New_York');
      expect(s.defaultCurrency).toBe('USD');
    });

    it('updates both fields when both provided', () => {
      const s = CrmSettings.create(TenantId('tenant-1'));
      s.pullDomainEvents();
      s.update({ defaultCurrency: 'CAD', timezone: 'America/Toronto' });
      expect(s.defaultCurrency).toBe('CAD');
      expect(s.timezone).toBe('America/Toronto');
    });

    it('updates nothing but still emits event when no changes', () => {
      const s = CrmSettings.create(TenantId('tenant-1'));
      s.pullDomainEvents();
      s.update({});
      expect(s.pullDomainEvents()).toHaveLength(1);
    });
  });
});
