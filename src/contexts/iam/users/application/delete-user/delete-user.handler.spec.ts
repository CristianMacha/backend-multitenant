import { EventBus } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { TenantId } from '@shared/domain/types';
import { User } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';
import { DeleteUserCommand } from './delete-user.command';
import { DeleteUserHandler } from './delete-user.handler';

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

describe('DeleteUserHandler', () => {
  it('soft-deletes user and publishes event', async () => {
    const { repo, save, publishAll, eventBus } = makeMocks();
    const handler = new DeleteUserHandler(repo, eventBus);
    await handler.execute(new DeleteUserCommand('user-1', 'tenant-1'));
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });

  it('throws EntityNotFoundException when user not found', async () => {
    const { repo, eventBus } = makeMocks();
    (repo.findById as jest.Mock).mockResolvedValue(null);
    const handler = new DeleteUserHandler(repo, eventBus);
    await expect(
      handler.execute(new DeleteUserCommand('missing', 'tenant-1')),
    ).rejects.toThrow(EntityNotFoundException);
  });
});
