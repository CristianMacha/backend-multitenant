import { TenantId, UserId } from '@shared/domain/types';
import { Contact } from '../../domain/entities/contact.entity';
import { ContactMapper } from './contact.mapper';

const makeRaw = () => ({
  id: 'contact-1',
  tenantId: 'tenant-1',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  phone: '+1-555-0200',
  jobTitle: 'Engineer',
  accountId: 'acct-1',
  ownerId: 'owner-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  deletedAt: null,
});

describe('ContactMapper', () => {
  describe('toDomain', () => {
    it('maps prisma row to Contact aggregate', () => {
      const contact = ContactMapper.toDomain(makeRaw());
      expect(contact.id).toBe('contact-1');
      expect(contact.firstName).toBe('Jane');
      expect(contact.lastName).toBe('Smith');
      expect(contact.accountId).toBe('acct-1');
    });

    it('handles null optional fields', () => {
      const raw = {
        ...makeRaw(),
        jobTitle: null,
        accountId: null,
        phone: null,
      };
      const contact = ContactMapper.toDomain(raw);
      expect(contact.jobTitle).toBeUndefined();
      expect(contact.accountId).toBeUndefined();
    });
  });

  describe('toPersistence', () => {
    it('maps Contact aggregate to persistence shape', () => {
      const contact = Contact.create({
        tenantId: TenantId('tenant-1'),
        firstName: 'Jane',
        lastName: 'Smith',
        ownerId: UserId('owner-1'),
      });
      contact.pullDomainEvents();
      const row = ContactMapper.toPersistence(contact);
      expect(row.firstName).toBe('Jane');
      expect(row.lastName).toBe('Smith');
      expect(row.tenantId).toBe('tenant-1');
    });
  });
});
