import { EventBus } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { TenantId, UserId } from '@shared/domain/types';
import { Account } from '@contexts/crm/accounts/domain/entities/account.entity';
import { AccountRepository } from '@contexts/crm/accounts/domain/repositories/account.repository';
import { ContactRepository } from '../../domain/repositories/contact.repository';
import { CreateContactCommand } from './create-contact.command';
import { CreateContactHandler } from './create-contact.handler';

const makeMocks = (account: Account | null = null) => {
  const save = jest
    .fn<Promise<void>, Parameters<ContactRepository['save']>>()
    .mockResolvedValue(undefined);
  const contactRepo: ContactRepository = {
    findById: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    save,
  };
  const findAccountById = jest
    .fn<ReturnType<AccountRepository['findById']>, unknown[]>()
    .mockResolvedValue(account);
  const accountRepo: AccountRepository = {
    findById: findAccountById,
    findMany: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const publishAll = jest.fn<void, Parameters<EventBus['publishAll']>>();
  const eventBus = { publishAll } as unknown as jest.Mocked<EventBus>;
  return {
    contactRepo,
    accountRepo,
    findAccountById,
    save,
    publishAll,
    eventBus,
  };
};

describe('CreateContactHandler', () => {
  it('creates a contact without an account link', async () => {
    const {
      contactRepo,
      accountRepo,
      findAccountById,
      save,
      publishAll,
      eventBus,
    } = makeMocks();
    const handler = new CreateContactHandler(
      contactRepo,
      accountRepo,
      eventBus,
    );

    const result = await handler.execute(
      new CreateContactCommand('tenant-1', 'owner-1', 'Jane', 'Doe'),
    );

    expect(result.id).toBeDefined();
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
    expect(findAccountById).not.toHaveBeenCalled();
  });

  it('validates the linked account exists in the tenant', async () => {
    const account = Account.create({
      tenantId: TenantId('tenant-1'),
      ownerId: UserId('owner-1'),
      name: 'Acme',
    });
    const { contactRepo, accountRepo, findAccountById, save, eventBus } =
      makeMocks(account);
    const handler = new CreateContactHandler(
      contactRepo,
      accountRepo,
      eventBus,
    );

    await handler.execute(
      new CreateContactCommand(
        'tenant-1',
        'owner-1',
        'Jane',
        'Doe',
        undefined,
        undefined,
        undefined,
        account.id,
      ),
    );

    expect(findAccountById).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('throws when the linked account does not exist', async () => {
    const { contactRepo, accountRepo, save, eventBus } = makeMocks(null);
    const handler = new CreateContactHandler(
      contactRepo,
      accountRepo,
      eventBus,
    );

    await expect(
      handler.execute(
        new CreateContactCommand(
          'tenant-1',
          'owner-1',
          'Jane',
          'Doe',
          undefined,
          undefined,
          undefined,
          '00000000-0000-0000-0000-000000000000',
        ),
      ),
    ).rejects.toBeInstanceOf(EntityNotFoundException);
    expect(save).not.toHaveBeenCalled();
  });
});
