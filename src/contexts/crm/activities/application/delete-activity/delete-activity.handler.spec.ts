import { EventBus } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { TenantId, UserId } from '@shared/domain/types';
import { Activity } from '../../domain/entities/activity.entity';
import { ActivityRepository } from '../../domain/repositories/activity.repository';
import { DeleteActivityCommand } from './delete-activity.command';
import { DeleteActivityHandler } from './delete-activity.handler';

const makeActivity = () => {
  const a = Activity.create({
    tenantId: TenantId('tenant-1'),
    type: 'TASK',
    subject: 'Call back',
    relatedToType: 'ACCOUNT',
    relatedToId: 'acct-1',
    ownerId: UserId('owner-1'),
  });
  a.pullDomainEvents();
  return a;
};

const makeMocks = () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const repo: ActivityRepository = {
    findById: jest.fn().mockResolvedValue(makeActivity()),
    findMany: jest.fn(),
    findTimeline: jest.fn(),
    save,
  };
  const publishAll = jest.fn();
  const eventBus = { publishAll } as unknown as EventBus;
  return { repo, save, publishAll, eventBus };
};

describe('DeleteActivityHandler', () => {
  it('soft-deletes activity and publishes event', async () => {
    const { repo, save, publishAll, eventBus } = makeMocks();
    const handler = new DeleteActivityHandler(repo, eventBus);
    await handler.execute(new DeleteActivityCommand('act-1', 'tenant-1'));
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });

  it('throws when activity not found', async () => {
    const { repo, eventBus } = makeMocks();
    (repo.findById as jest.Mock).mockResolvedValue(null);
    const handler = new DeleteActivityHandler(repo, eventBus);
    await expect(
      handler.execute(new DeleteActivityCommand('missing', 'tenant-1')),
    ).rejects.toThrow(NotFoundException);
  });
});
