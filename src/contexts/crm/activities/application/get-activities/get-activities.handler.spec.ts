import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { GetActivitiesQuery } from './get-activities.query';
import { GetActivitiesHandler } from './get-activities.handler';

const RAW_ACTIVITY = {
  id: 'act-1',
  tenantId: 'tenant-1',
  type: 'TASK',
  subject: 'Follow up',
  body: null,
  dueAt: null,
  completedAt: null,
  status: 'PENDING',
  ownerId: 'owner-1',
  source: 'MANUAL',
  relatedToType: 'ACCOUNT',
  relatedToId: 'acct-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const makePrisma = (rows: (typeof RAW_ACTIVITY)[], total: number) =>
  ({
    activity: {
      findMany: jest.fn().mockResolvedValue(rows),
      count: jest.fn().mockResolvedValue(total),
    },
    $transaction: jest
      .fn()
      .mockImplementation((arr: Promise<unknown>[]) => Promise.all(arr)),
  }) as unknown as PrismaService;

describe('GetActivitiesHandler', () => {
  it('returns paginated result of activities', async () => {
    const handler = new GetActivitiesHandler(makePrisma([RAW_ACTIVITY], 1));
    const result = await handler.execute(
      new GetActivitiesQuery('tenant-1', 1, 10),
    );
    expect(result.items).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('returns empty page when no activities found', async () => {
    const handler = new GetActivitiesHandler(makePrisma([], 0));
    const result = await handler.execute(
      new GetActivitiesQuery('tenant-1', 1, 10),
    );
    expect(result.items).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });

  it('filters by all optional params when provided', async () => {
    const handler = new GetActivitiesHandler(makePrisma([RAW_ACTIVITY], 1));
    const from = new Date('2024-01-01');
    const to = new Date('2024-12-31');
    const result = await handler.execute(
      new GetActivitiesQuery(
        'tenant-1',
        1,
        10,
        'ACCOUNT',
        'acct-1',
        'owner-1',
        'PENDING',
        from,
        to,
      ),
    );
    expect(result.items).toHaveLength(1);
  });
});
