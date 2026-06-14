import { EventBus } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { TenantId, UserId } from '@shared/domain/types';
import { Activity } from '../../domain/entities/activity.entity';
import { ActivityRepository } from '../../domain/repositories/activity.repository';
import { JobsService } from '@platform/jobs/application/jobs.service';
import { RescheduleActivityCommand } from './reschedule-activity.command';
import { RescheduleActivityHandler } from './reschedule-activity.handler';

const makeActivity = () => {
  const a = Activity.create({
    tenantId: TenantId('tenant-1'),
    type: 'TASK',
    subject: 'Follow up',
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
  const enqueueActivityReminder = jest.fn().mockResolvedValue(undefined);
  const jobsService = {
    enqueueActivityReminder,
  } as unknown as JobsService;
  return {
    repo,
    save,
    publishAll,
    eventBus,
    jobsService,
    enqueueActivityReminder,
  };
};

describe('RescheduleActivityHandler', () => {
  it('reschedules and enqueues reminder for future dueAt', async () => {
    const {
      repo,
      save,
      publishAll,
      eventBus,
      jobsService,
      enqueueActivityReminder,
    } = makeMocks();
    const handler = new RescheduleActivityHandler(repo, eventBus, jobsService);
    const futureDate = new Date(Date.now() + 60_000);
    await handler.execute(
      new RescheduleActivityCommand('act-1', 'tenant-1', futureDate),
    );
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
    expect(enqueueActivityReminder).toHaveBeenCalledTimes(1);
  });

  it('does not enqueue reminder for past dueAt', async () => {
    const { repo, eventBus, jobsService, enqueueActivityReminder } =
      makeMocks();
    const handler = new RescheduleActivityHandler(repo, eventBus, jobsService);
    const pastDate = new Date(Date.now() - 60_000);
    await handler.execute(
      new RescheduleActivityCommand('act-1', 'tenant-1', pastDate),
    );
    expect(enqueueActivityReminder).not.toHaveBeenCalled();
  });

  it('throws when activity not found', async () => {
    const { repo, eventBus, jobsService } = makeMocks();
    (repo.findById as jest.Mock).mockResolvedValue(null);
    const handler = new RescheduleActivityHandler(repo, eventBus, jobsService);
    await expect(
      handler.execute(
        new RescheduleActivityCommand('missing', 'tenant-1', new Date()),
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
