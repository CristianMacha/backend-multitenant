import { EventBus } from '@nestjs/cqrs';
import { TenantId } from '@shared/domain/types';
import { EntityAlreadyExistsException } from '@shared/exceptions';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { CreateUserCommand } from './create-user.command';
import { CreateUserHandler } from './create-user.handler';

const makeMocks = (overrides: Partial<UserRepository> = {}) => {
  const save = jest
    .fn<Promise<void>, Parameters<UserRepository['save']>>()
    .mockResolvedValue(undefined);
  const findByEmail = jest
    .fn<
      ReturnType<UserRepository['findByEmail']>,
      Parameters<UserRepository['findByEmail']>
    >()
    .mockResolvedValue(null);
  const repo: UserRepository = {
    findById: jest.fn().mockResolvedValue(null),
    findByEmail,
    findByFirebaseUid: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    save,
    ...overrides,
  };
  const publishAll = jest.fn<void, Parameters<EventBus['publishAll']>>();
  const eventBus = { publishAll } as unknown as jest.Mocked<EventBus>;
  return { repo, save, findByEmail, publishAll, eventBus };
};

describe('CreateUserHandler', () => {
  it('creates a user and publishes UserCreatedEvent', async () => {
    const { repo, save, publishAll, eventBus } = makeMocks();
    const handler = new CreateUserHandler(repo, eventBus);

    const result = await handler.execute(
      new CreateUserCommand(
        'tenant-1',
        'uid-1',
        'john@example.com',
        'John',
        'Doe',
      ),
    );

    expect(result.id).toBeDefined();
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });

  it('normalizes email before duplicate check', async () => {
    const { repo, findByEmail, eventBus } = makeMocks();
    const handler = new CreateUserHandler(repo, eventBus);

    await handler.execute(
      new CreateUserCommand(
        'tenant-1',
        'uid-1',
        '  John@EXAMPLE.COM  ',
        'John',
        'Doe',
      ),
    );

    expect(findByEmail).toHaveBeenCalledWith(
      '  John@EXAMPLE.COM  ',
      TenantId('tenant-1'),
    );
  });

  it('throws when email already exists in tenant', async () => {
    const existing = User.create({
      tenantId: TenantId('tenant-1'),
      firebaseUid: 'uid-0',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
    });
    const { repo, save, eventBus } = makeMocks({
      findByEmail: jest.fn().mockResolvedValue(existing),
    });
    const handler = new CreateUserHandler(repo, eventBus);

    await expect(
      handler.execute(
        new CreateUserCommand(
          'tenant-1',
          'uid-1',
          'john@example.com',
          'John',
          'Doe',
        ),
      ),
    ).rejects.toBeInstanceOf(EntityAlreadyExistsException);
    expect(save).not.toHaveBeenCalled();
  });
});
