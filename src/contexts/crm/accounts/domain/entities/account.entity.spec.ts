import { TenantId, UserId } from '@shared/domain/types';
import { DomainException } from '@shared/exceptions';
import { Account } from './account.entity';
import {
  AccountArchivedEvent,
  AccountCreatedEvent,
  AccountOwnerChangedEvent,
  AccountUpdatedEvent,
} from '../events/account.events';

const makeAccount = () =>
  Account.create({
    tenantId: TenantId('tenant-1'),
    ownerId: UserId('owner-1'),
    name: 'Acme Corporation',
    phone: '+1 (415) 555-2671',
  });

describe('Account', () => {
  it('creates an active account and emits AccountCreated', () => {
    const account = makeAccount();
    expect(account.status).toBe('ACTIVE');
    expect(account.phone).toBe('+14155552671');
    expect(account.domainEvents[0]).toBeInstanceOf(AccountCreatedEvent);
  });

  it('rejects a blank name', () => {
    expect(() =>
      Account.create({
        tenantId: TenantId('tenant-1'),
        ownerId: UserId('owner-1'),
        name: '   ',
      }),
    ).toThrow(DomainException);
  });

  it('applies updates and emits AccountUpdated only when something changed', () => {
    const account = makeAccount();
    account.pullDomainEvents();

    account.update({ industry: 'Manufacturing', phone: null });
    expect(account.industry).toBe('Manufacturing');
    expect(account.phone).toBeUndefined();
    const events = account.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(AccountUpdatedEvent);

    account.update({});
    expect(account.pullDomainEvents()).toHaveLength(0);
  });

  it('changes owner and emits AccountOwnerChanged', () => {
    const account = makeAccount();
    account.pullDomainEvents();
    account.changeOwner(UserId('owner-2'));
    expect(account.ownerId).toBe('owner-2');
    expect(account.pullDomainEvents()[0]).toBeInstanceOf(
      AccountOwnerChangedEvent,
    );
  });

  it('archives the account, soft-deletes it and blocks further changes', () => {
    const account = makeAccount();
    account.pullDomainEvents();
    account.archive();

    expect(account.isArchived).toBe(true);
    expect(account.isDeleted).toBe(true);
    expect(account.pullDomainEvents()[0]).toBeInstanceOf(AccountArchivedEvent);
    expect(() => account.update({ name: 'New' })).toThrow(DomainException);
    expect(() => account.archive()).toThrow(DomainException);
  });
});
