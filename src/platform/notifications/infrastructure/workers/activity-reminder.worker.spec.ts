import { Job } from 'bullmq';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  ActivityReminderJobData,
  JOB_NAMES,
} from '@platform/jobs/domain/queues';
import {
  CreateNotificationInput,
  NotificationService,
} from '../../application/notification.service';
import { ActivityReminderWorker } from './activity-reminder.worker';

const TENANT_ID = 'tenant-uuid';
const ACTIVITY_ID = 'activity-uuid';
const OWNER_ID = 'owner-uuid';

const makeJob = (
  name: string,
  data: ActivityReminderJobData,
): Job<ActivityReminderJobData> =>
  ({ name, data }) as unknown as Job<ActivityReminderJobData>;

const makeActivity = (overrides: Record<string, unknown> = {}) => ({
  id: ACTIVITY_ID,
  ownerId: OWNER_ID,
  subject: 'Follow-up call',
  dueAt: new Date(),
  ...overrides,
});

const makeMocks = (
  activity: Record<string, unknown> | null = makeActivity(),
) => {
  const findFirst = jest.fn().mockResolvedValue(activity);
  const prisma = {
    activity: { findFirst },
  } as unknown as PrismaService;

  const create = jest.fn().mockResolvedValue({ id: 'new-notif-id' });
  const notificationService = { create } as unknown as NotificationService;

  return { prisma, notificationService, findFirst, create };
};

describe('ActivityReminderWorker', () => {
  it('creates a notification with type ACTIVITY_REMINDER for the activity owner (R9, R10)', async () => {
    const { prisma, notificationService, create } = makeMocks();
    const worker = new ActivityReminderWorker(prisma, notificationService);

    await worker.process(
      makeJob(JOB_NAMES.ACTIVITY_REMINDER_DUE, {
        activityId: ACTIVITY_ID,
        tenantId: TENANT_ID,
        dueAt: new Date().toISOString(),
      }),
    );

    expect(create).toHaveBeenCalledTimes(1);
    const [callArg] = create.mock.calls[0] as [CreateNotificationInput];
    expect(callArg.tenantId).toBe(TENANT_ID);
    expect(callArg.userId).toBe(OWNER_ID);
    expect(callArg.type).toBe('ACTIVITY_REMINDER');
    expect(callArg.title).toBe('Activity reminder');
    expect(callArg.body).toContain('Follow-up call');
  });

  it('does not create notification when activity does not exist (R11)', async () => {
    const { prisma, notificationService, create } = makeMocks(null);
    const worker = new ActivityReminderWorker(prisma, notificationService);

    await worker.process(
      makeJob(JOB_NAMES.ACTIVITY_REMINDER_DUE, {
        activityId: 'nonexistent',
        tenantId: TENANT_ID,
        dueAt: new Date().toISOString(),
      }),
    );

    expect(create).not.toHaveBeenCalled();
  });

  it('does not create notification when activity is soft-deleted (R11)', async () => {
    // findFirst with deletedAt:null filter will return null for soft-deleted records
    const { prisma, notificationService, create } = makeMocks(null);
    const worker = new ActivityReminderWorker(prisma, notificationService);

    await worker.process(
      makeJob(JOB_NAMES.ACTIVITY_REMINDER_DUE, {
        activityId: ACTIVITY_ID,
        tenantId: TENANT_ID,
        dueAt: new Date().toISOString(),
      }),
    );

    expect(create).not.toHaveBeenCalled();
  });

  it('does not create notification when activity has no ownerId (R11)', async () => {
    const activityWithoutOwner = makeActivity({ ownerId: null });
    const { prisma, notificationService, create } =
      makeMocks(activityWithoutOwner);
    const worker = new ActivityReminderWorker(prisma, notificationService);

    await worker.process(
      makeJob(JOB_NAMES.ACTIVITY_REMINDER_DUE, {
        activityId: ACTIVITY_ID,
        tenantId: TENANT_ID,
        dueAt: new Date().toISOString(),
      }),
    );

    expect(create).not.toHaveBeenCalled();
  });

  it('ignores jobs with unknown names (R9)', async () => {
    const { prisma, notificationService, create, findFirst } = makeMocks();
    const worker = new ActivityReminderWorker(prisma, notificationService);

    await worker.process(
      makeJob('unknown-job-name', {
        activityId: ACTIVITY_ID,
        tenantId: TENANT_ID,
        dueAt: new Date().toISOString(),
      }),
    );

    expect(findFirst).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('queries activity with tenantId and deletedAt:null filters (R9, R11)', async () => {
    const { prisma, notificationService, findFirst } = makeMocks();
    const worker = new ActivityReminderWorker(prisma, notificationService);

    await worker.process(
      makeJob(JOB_NAMES.ACTIVITY_REMINDER_DUE, {
        activityId: ACTIVITY_ID,
        tenantId: TENANT_ID,
        dueAt: new Date().toISOString(),
      }),
    );

    expect(findFirst).toHaveBeenCalledWith({
      where: { id: ACTIVITY_ID, tenantId: TENANT_ID, deletedAt: null },
      select: { id: true, ownerId: true, subject: true, dueAt: true },
    });
  });
});
