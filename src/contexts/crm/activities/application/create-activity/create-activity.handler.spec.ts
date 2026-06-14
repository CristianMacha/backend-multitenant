import { EventBus } from '@nestjs/cqrs';
import { BusinessException } from '@shared/exceptions';
import { CrmLookup } from '@contexts/crm/lookup/crm-lookup.port';
import { SalesLookup } from '@contexts/sales/lookup/sales-lookup.port';
import { JobsService } from '@platform/jobs/application/jobs.service';
import { ActivityRepository } from '../../domain/repositories/activity.repository';
import { CreateActivityCommand } from './create-activity.command';
import { CreateActivityHandler } from './create-activity.handler';

const makeMocks = () => {
  const save = jest
    .fn<Promise<void>, Parameters<ActivityRepository['save']>>()
    .mockResolvedValue(undefined);
  const repo: ActivityRepository = {
    findById: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    findTimeline: jest.fn().mockResolvedValue([]),
    save,
  };
  const crmLookup: CrmLookup = {
    accountExists: jest.fn().mockResolvedValue(true),
    contactExists: jest.fn().mockResolvedValue(true),
  };
  const opportunityExists = jest.fn().mockResolvedValue(true);
  const salesLookup: SalesLookup = { opportunityExists };
  const enqueueActivityReminder = jest.fn().mockResolvedValue(undefined);
  const jobsService = { enqueueActivityReminder } as unknown as JobsService;
  const publishAll = jest.fn<void, Parameters<EventBus['publishAll']>>();
  const eventBus = { publishAll } as unknown as jest.Mocked<EventBus>;

  return {
    repo,
    save,
    crmLookup,
    salesLookup,
    opportunityExists,
    jobsService,
    enqueueActivityReminder,
    publishAll,
    eventBus,
  };
};

describe('CreateActivityHandler', () => {
  it('creates an activity linked to an account and publishes events', async () => {
    const {
      repo,
      save,
      publishAll,
      eventBus,
      crmLookup,
      salesLookup,
      jobsService,
    } = makeMocks();
    const handler = new CreateActivityHandler(
      repo,
      crmLookup,
      salesLookup,
      eventBus,
      jobsService,
    );

    const result = await handler.execute(
      new CreateActivityCommand(
        'tenant-1',
        'owner-1',
        'CALL',
        'Follow-up call',
        'ACCOUNT',
        'account-uuid',
      ),
    );

    expect(result.id).toBeDefined();
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
    expect(publishAll.mock.calls[0][0]).toHaveLength(1);
  });

  it('enqueues a reminder when dueAt is in the future', async () => {
    const {
      repo,
      eventBus,
      crmLookup,
      salesLookup,
      jobsService,
      enqueueActivityReminder,
    } = makeMocks();
    const handler = new CreateActivityHandler(
      repo,
      crmLookup,
      salesLookup,
      eventBus,
      jobsService,
    );

    const futureDate = new Date(Date.now() + 60_000);
    await handler.execute(
      new CreateActivityCommand(
        'tenant-1',
        'owner-1',
        'TASK',
        'Send proposal',
        'ACCOUNT',
        'account-uuid',
        undefined,
        futureDate,
      ),
    );

    expect(enqueueActivityReminder).toHaveBeenCalledTimes(1);
  });

  it('throws BusinessException when related record does not exist', async () => {
    const { repo, eventBus, crmLookup, salesLookup, jobsService } = makeMocks();
    (crmLookup.accountExists as jest.Mock).mockResolvedValue(false);
    const handler = new CreateActivityHandler(
      repo,
      crmLookup,
      salesLookup,
      eventBus,
      jobsService,
    );

    await expect(
      handler.execute(
        new CreateActivityCommand(
          'tenant-1',
          'owner-1',
          'CALL',
          'Call',
          'ACCOUNT',
          'nonexistent-uuid',
        ),
      ),
    ).rejects.toBeInstanceOf(BusinessException);
  });

  it('validates opportunity via salesLookup', async () => {
    const {
      repo,
      save,
      publishAll,
      eventBus,
      crmLookup,
      salesLookup,
      opportunityExists,
      jobsService,
    } = makeMocks();
    const handler = new CreateActivityHandler(
      repo,
      crmLookup,
      salesLookup,
      eventBus,
      jobsService,
    );

    await handler.execute(
      new CreateActivityCommand(
        'tenant-1',
        'owner-1',
        'MEETING',
        'Discovery meeting',
        'OPPORTUNITY',
        'opp-uuid',
      ),
    );

    expect(opportunityExists).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
    );
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });
});
