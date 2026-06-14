import { EventBus } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { TenantId, UserId } from '@shared/domain/types';
import { Account } from '@contexts/crm/accounts/domain/entities/account.entity';
import { AccountRepository } from '@contexts/crm/accounts/domain/repositories/account.repository';
import { Contact } from '../../domain/entities/contact.entity';
import { ContactRepository } from '../../domain/repositories/contact.repository';
import { LinkContactToAccountCommand } from './link-contact-to-account.command';
import { LinkContactToAccountHandler } from './link-contact-to-account.handler';

const makeContact = () => {
  const c = Contact.create({
    tenantId: TenantId('tenant-1'),
    ownerId: UserId('owner-1'),
    firstName: 'Jane',
    lastName: 'Doe',
  });
  c.pullDomainEvents();
  return c;
};

const makeAccount = () => {
  const a = Account.create({
    tenantId: TenantId('tenant-1'),
    name: 'Acme',
    ownerId: UserId('owner-1'),
  });
  a.pullDomainEvents();
  return a;
};

const makeMocks = () => {
  const contactSave = jest.fn().mockResolvedValue(undefined);
  const contactRepo: ContactRepository = {
    findById: jest.fn().mockResolvedValue(makeContact()),
    findMany: jest.fn(),
    save: contactSave,
  };
  const accountRepo: AccountRepository = {
    findById: jest.fn().mockResolvedValue(makeAccount()),
    findMany: jest.fn(),
    save: jest.fn(),
  };
  const publishAll = jest.fn();
  const eventBus = { publishAll } as unknown as EventBus;
  return { contactRepo, accountRepo, contactSave, publishAll, eventBus };
};

describe('LinkContactToAccountHandler', () => {
  it('links contact to an account', async () => {
    const { contactRepo, accountRepo, contactSave, publishAll, eventBus } =
      makeMocks();
    const handler = new LinkContactToAccountHandler(
      contactRepo,
      accountRepo,
      eventBus,
    );
    await handler.execute(
      new LinkContactToAccountCommand('c-1', 'tenant-1', 'acct-1'),
    );
    expect(contactSave).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });

  it('unlinks contact when accountId is null', async () => {
    const { contactRepo, accountRepo, contactSave, eventBus } = makeMocks();
    const handler = new LinkContactToAccountHandler(
      contactRepo,
      accountRepo,
      eventBus,
    );
    await handler.execute(
      new LinkContactToAccountCommand('c-1', 'tenant-1', null),
    );
    expect(contactSave).toHaveBeenCalledTimes(1);
  });

  it('throws when contact not found', async () => {
    const { contactRepo, accountRepo, eventBus } = makeMocks();
    (contactRepo.findById as jest.Mock).mockResolvedValue(null);
    const handler = new LinkContactToAccountHandler(
      contactRepo,
      accountRepo,
      eventBus,
    );
    await expect(
      handler.execute(
        new LinkContactToAccountCommand('missing', 'tenant-1', 'acct-1'),
      ),
    ).rejects.toThrow(EntityNotFoundException);
  });

  it('throws when account not found', async () => {
    const { contactRepo, accountRepo, eventBus } = makeMocks();
    (accountRepo.findById as jest.Mock).mockResolvedValue(null);
    const handler = new LinkContactToAccountHandler(
      contactRepo,
      accountRepo,
      eventBus,
    );
    await expect(
      handler.execute(
        new LinkContactToAccountCommand('c-1', 'tenant-1', 'bad-acct'),
      ),
    ).rejects.toThrow(EntityNotFoundException);
  });
});
