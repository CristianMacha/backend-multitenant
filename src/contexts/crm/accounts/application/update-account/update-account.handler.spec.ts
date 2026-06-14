import { EventBus } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { TenantId, UserId } from '@shared/domain/types';
import { Account } from '../../domain/entities/account.entity';
import { AccountRepository } from '../../domain/repositories/account.repository';
import { UpdateAccountCommand } from './update-account.command';
import { UpdateAccountHandler } from './update-account.handler';

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
  const save = jest.fn().mockResolvedValue(undefined);
  const repo: AccountRepository = {
    findById: jest.fn().mockResolvedValue(makeAccount()),
    findMany: jest.fn(),
    save,
  };
  const publishAll = jest.fn();
  const eventBus = { publishAll } as unknown as EventBus;
  return { repo, save, publishAll, eventBus };
};

describe('UpdateAccountHandler', () => {
  it('updates account fields and publishes event', async () => {
    const { repo, save, publishAll, eventBus } = makeMocks();
    const handler = new UpdateAccountHandler(repo, eventBus);
    await handler.execute(
      new UpdateAccountCommand('acct-1', 'tenant-1', { name: 'Acme Corp' }),
    );
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });

  it('throws when account not found', async () => {
    const { repo, eventBus } = makeMocks();
    (repo.findById as jest.Mock).mockResolvedValue(null);
    const handler = new UpdateAccountHandler(repo, eventBus);
    await expect(
      handler.execute(
        new UpdateAccountCommand('missing', 'tenant-1', { name: 'X' }),
      ),
    ).rejects.toThrow(EntityNotFoundException);
  });
});
