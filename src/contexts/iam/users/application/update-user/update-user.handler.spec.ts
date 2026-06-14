import { EventBus } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { TenantId } from '@shared/domain/types';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UpdateUserCommand } from './update-user.command';
import { UpdateUserHandler } from './update-user.handler';

const makeUser = () => {
  const u = User.create({
    tenantId: TenantId('tenant-1'),
    firebaseUid: 'firebase-uid-1',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
  });
  u.pullDomainEvents();
  return u;
};

const makeMocks = () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const repo: UserRepository = {
    findById: jest.fn().mockResolvedValue(makeUser()),
    findByEmail: jest.fn(),
    findByFirebaseUid: jest.fn(),
    findMany: jest.fn(),
    save,
  };
  const publishAll = jest.fn();
  const eventBus = { publishAll } as unknown as EventBus;
  return { repo, save, publishAll, eventBus };
};

describe('UpdateUserHandler', () => {
  it('updates user and publishes event', async () => {
    const { repo, save, publishAll, eventBus } = makeMocks();
    const handler = new UpdateUserHandler(repo, eventBus);
    await handler.execute(
      new UpdateUserCommand('user-1', 'tenant-1', { firstName: 'Jane' }),
    );
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });

  it('throws when user not found', async () => {
    const { repo, eventBus } = makeMocks();
    (repo.findById as jest.Mock).mockResolvedValue(null);
    const handler = new UpdateUserHandler(repo, eventBus);
    await expect(
      handler.execute(new UpdateUserCommand('missing', 'tenant-1', {})),
    ).rejects.toThrow(EntityNotFoundException);
  });
});
