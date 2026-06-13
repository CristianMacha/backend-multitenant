import { EventBus } from '@nestjs/cqrs';
import { AccountRepository } from '../../domain/repositories/account.repository';
import { CreateAccountCommand } from './create-account.command';
import { CreateAccountHandler } from './create-account.handler';

const makeMocks = () => {
  const save = jest
    .fn<Promise<void>, Parameters<AccountRepository['save']>>()
    .mockResolvedValue(undefined);
  const repo: AccountRepository = {
    findById: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    save,
  };
  const publishAll = jest.fn<void, Parameters<EventBus['publishAll']>>();
  const eventBus = { publishAll } as unknown as jest.Mocked<EventBus>;
  return { repo, save, publishAll, eventBus };
};

describe('CreateAccountHandler', () => {
  it('creates an account and publishes its events', async () => {
    const { repo, save, publishAll, eventBus } = makeMocks();
    const handler = new CreateAccountHandler(repo, eventBus);

    const result = await handler.execute(
      new CreateAccountCommand(
        'tenant-1',
        'owner-1',
        'Acme Corporation',
        'Manufacturing',
      ),
    );

    expect(result.id).toBeDefined();
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
    // events are pulled before save, so the published list is non-empty
    expect(publishAll.mock.calls[0][0]).toHaveLength(1);
  });

  it('propagates invalid value objects as domain errors', async () => {
    const { repo, save, eventBus } = makeMocks();
    const handler = new CreateAccountHandler(repo, eventBus);

    await expect(
      handler.execute(
        new CreateAccountCommand(
          'tenant-1',
          'owner-1',
          'Acme',
          undefined,
          undefined,
          'not-a-phone',
        ),
      ),
    ).rejects.toThrow();
    expect(save).not.toHaveBeenCalled();
  });
});
