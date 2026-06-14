import { EventBus } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { Role } from '../../domain/entities/role.entity';
import { RoleRepository } from '../../domain/repositories/role.repository';
import { UpdateRoleCommand } from './update-role.command';
import { UpdateRoleHandler } from './update-role.handler';

const makeRole = () => {
  const r = Role.create('tenant-1', 'CUSTOM_ROLE', null);
  r.pullDomainEvents();
  return r;
};

const makeMocks = () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const repo: RoleRepository = {
    findById: jest.fn().mockResolvedValue(makeRole()),
    findByName: jest.fn(),
    save,
  };
  const publishAll = jest.fn();
  const eventBus = { publishAll } as unknown as EventBus;
  return { repo, save, publishAll, eventBus };
};

describe('UpdateRoleHandler', () => {
  it('updates role and publishes event', async () => {
    const { repo, save, publishAll, eventBus } = makeMocks();
    const handler = new UpdateRoleHandler(repo, eventBus);
    await handler.execute(
      new UpdateRoleCommand('role-1', 'tenant-1', { name: 'UPDATED_ROLE' }),
    );
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });

  it('throws when role not found', async () => {
    const { repo, eventBus } = makeMocks();
    (repo.findById as jest.Mock).mockResolvedValue(null);
    const handler = new UpdateRoleHandler(repo, eventBus);
    await expect(
      handler.execute(new UpdateRoleCommand('missing', 'tenant-1', {})),
    ).rejects.toThrow(EntityNotFoundException);
  });
});
