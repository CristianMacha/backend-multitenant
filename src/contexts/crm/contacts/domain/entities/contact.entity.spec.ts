import { AccountId, TenantId, UserId } from '@shared/domain/types';
import { DomainException } from '@shared/exceptions';
import { Contact } from './contact.entity';
import {
  ContactCreatedEvent,
  ContactDeletedEvent,
  ContactLinkedToAccountEvent,
  ContactUpdatedEvent,
} from '../events/contact.events';

const makeContact = () =>
  Contact.create({
    tenantId: TenantId('tenant-1'),
    ownerId: UserId('owner-1'),
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@example.com',
  });

describe('Contact', () => {
  it('creates a contact and emits ContactCreated', () => {
    const contact = makeContact();
    expect(contact.fullName).toBe('Jane Doe');
    expect(contact.email).toBe('jane.doe@example.com');
    expect(contact.domainEvents[0]).toBeInstanceOf(ContactCreatedEvent);
  });

  it('requires both first and last name', () => {
    expect(() =>
      Contact.create({
        tenantId: TenantId('tenant-1'),
        ownerId: UserId('owner-1'),
        firstName: 'Jane',
        lastName: '  ',
      }),
    ).toThrow(DomainException);
  });

  it('updates fields and clears with null', () => {
    const contact = makeContact();
    contact.pullDomainEvents();

    contact.update({ jobTitle: 'Buyer', email: null });
    expect(contact.jobTitle).toBe('Buyer');
    expect(contact.email).toBeUndefined();
    expect(contact.pullDomainEvents()[0]).toBeInstanceOf(ContactUpdatedEvent);
  });

  it('links and unlinks an account, emitting ContactLinkedToAccount', () => {
    const contact = makeContact();
    contact.pullDomainEvents();

    contact.linkToAccount(AccountId('acc-1'));
    expect(contact.accountId).toBe('acc-1');
    expect(contact.pullDomainEvents()[0]).toBeInstanceOf(
      ContactLinkedToAccountEvent,
    );

    contact.linkToAccount(null);
    expect(contact.accountId).toBeUndefined();
    expect(contact.pullDomainEvents()).toHaveLength(1);

    // linking to the same value is a no-op
    contact.linkToAccount(null);
    expect(contact.pullDomainEvents()).toHaveLength(0);
  });

  it('soft-deletes and blocks further changes', () => {
    const contact = makeContact();
    contact.pullDomainEvents();
    contact.delete();

    expect(contact.isDeleted).toBe(true);
    expect(contact.pullDomainEvents()[0]).toBeInstanceOf(ContactDeletedEvent);
    expect(() => contact.update({ firstName: 'X' })).toThrow(DomainException);
    expect(() => contact.delete()).toThrow(DomainException);
  });
});
