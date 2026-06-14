import { TenantId, UserId } from '@shared/domain/types';
import { Account } from '../../domain/entities/account.entity';
import { AccountMapper } from './account.mapper';

const makeRaw = () => ({
  id: 'acct-1',
  tenantId: 'tenant-1',
  name: 'Acme Corp',
  industry: 'Technology',
  website: 'https://acme.com',
  phone: '+1-555-0100',
  address: null,
  ownerId: 'owner-1',
  status: 'ACTIVE',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  deletedAt: null,
});

describe('AccountMapper', () => {
  describe('toDomain', () => {
    it('maps prisma row to Account aggregate', () => {
      const raw = makeRaw();
      const account = AccountMapper.toDomain(raw as never);
      expect(account.id).toBe('acct-1');
      expect(account.name).toBe('Acme Corp');
      expect(account.tenantId).toBe('tenant-1');
      expect(account.industry).toBe('Technology');
      expect(account.ownerId).toBe('owner-1');
    });

    it('handles null optional fields', () => {
      const raw = { ...makeRaw(), industry: null, website: null, phone: null };
      const account = AccountMapper.toDomain(raw as never);
      expect(account.industry).toBeUndefined();
      expect(account.website).toBeUndefined();
    });
  });

  describe('toPersistence', () => {
    it('maps Account aggregate to persistence shape', () => {
      const account = Account.create({
        tenantId: TenantId('tenant-1'),
        name: 'Acme Corp',
        ownerId: UserId('owner-1'),
      });
      account.pullDomainEvents();
      const row = AccountMapper.toPersistence(account);
      expect(row.name).toBe('Acme Corp');
      expect(row.tenantId).toBe('tenant-1');
      expect(row.ownerId).toBe('owner-1');
    });
  });
});
