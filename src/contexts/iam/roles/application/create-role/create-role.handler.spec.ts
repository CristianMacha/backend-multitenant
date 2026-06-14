import { EventBus } from '@nestjs/cqrs';
import { EntityAlreadyExistsException } from '@shared/exceptions';
import { RoleRepository } from '../../domain/repositories/role.repository';
import { CreateRoleCommand } from './create-role.command';
import { CreateRoleHandler } from './create-role.handler';

const makeMocks = (existingRole: unknown = null) => {
  const save = jest.fn().mockResolvedValue(undefined);
  const repo: RoleRepository = {
    findById: jest.fn(),
    findByName: jest.fn().mockResolvedValue(existingRole),
    save,
  };
  const publishAll = jest.fn();
  const eventBus = { publishAll } as unknown as EventBus;
  return { repo, save, publishAll, eventBus };
};

describe('CreateRoleHandler', () => {
  it('creates role and returns id', async () => {
    const { repo, save, publishAll, eventBus } = makeMocks();
    const handler = new CreateRoleHandler(repo, eventBus);
    const result = await handler.execute(
      new CreateRoleCommand('tenant-1', 'SALES_REP', 'Sales representative'),
    );
    expect(typeof result.id).toBe('string');
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });

  it('creates role without description', async () => {
    const { repo, save, eventBus } = makeMocks();
    const handler = new CreateRoleHandler(repo, eventBus);
    const result = await handler.execute(
      new CreateRoleCommand('tenant-1', 'VIEWER'),
    );
    expect(typeof result.id).toBe('string');
    expect(save).toHaveBeenCalledTimes(1);
  });

  it('throws EntityAlreadyExistsException when role name exists', async () => {
    const { repo, eventBus } = makeMocks({ id: 'existing' });
    const handler = new CreateRoleHandler(repo, eventBus);
    await expect(
      handler.execute(new CreateRoleCommand('tenant-1', 'DUPLICATE')),
    ).rejects.toThrow(EntityAlreadyExistsException);
  });
});
