import { Test, TestingModule } from '@nestjs/testing';
import { GetDashboardSummaryHandler } from './get-dashboard-summary.handler';
import { GetDashboardSummaryQuery } from './get-dashboard-summary.query';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { CacheService } from '@platform/cache/application/cache.service';

const TENANT_ID = 'tenant-1';
const USER_ID = 'user-1';
const NOW = new Date('2026-06-13T12:00:00Z');

function makeMocks() {
  const activityFindMany = jest.fn().mockResolvedValue([]);
  const opportunityGroupBy = jest.fn().mockResolvedValue([]);
  const pipelineFindFirst = jest.fn().mockResolvedValue(null);
  const cacheGetOrSet = jest
    .fn()
    .mockImplementation(async (_key: string, factory: () => Promise<unknown>) =>
      factory(),
    );

  const prisma = {
    activity: { findMany: activityFindMany },
    opportunity: { groupBy: opportunityGroupBy },
    pipeline: { findFirst: pipelineFindFirst },
  } as unknown as PrismaService;

  const cache = { getOrSet: cacheGetOrSet } as unknown as CacheService;

  return {
    prisma,
    cache,
    activityFindMany,
    opportunityGroupBy,
    pipelineFindFirst,
    cacheGetOrSet,
  };
}

describe('GetDashboardSummaryHandler', () => {
  let handler: GetDashboardSummaryHandler;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);

    mocks = makeMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetDashboardSummaryHandler,
        { provide: PrismaService, useValue: mocks.prisma },
        { provide: CacheService, useValue: mocks.cache },
      ],
    }).compile();

    handler = module.get(GetDashboardSummaryHandler);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns empty dashboard when no data exists', async () => {
    const query = new GetDashboardSummaryQuery(TENANT_ID, USER_ID, undefined);
    const result = await handler.execute(query);

    expect(result).toEqual({
      tasksToday: { count: 0, items: [] },
      openOpportunityValue: [],
      closedWonThisMonth: [],
      funnelSnapshot: [],
    });
  });

  it('uses cache key scoped to all for admin/manager (no scopedOwnerId)', async () => {
    const query = new GetDashboardSummaryQuery(TENANT_ID, USER_ID, undefined);
    await handler.execute(query);

    const [cacheKey] = mocks.cacheGetOrSet.mock.calls[0] as [
      string,
      ...unknown[],
    ];
    expect(cacheKey).toBe(`dashboard:summary:${TENANT_ID}:${USER_ID}:all`);
  });

  it('uses cache key scoped to user id for agents', async () => {
    const query = new GetDashboardSummaryQuery(TENANT_ID, USER_ID, USER_ID);
    await handler.execute(query);

    const [cacheKey] = mocks.cacheGetOrSet.mock.calls[0] as [
      string,
      ...unknown[],
    ];
    expect(cacheKey).toBe(
      `dashboard:summary:${TENANT_ID}:${USER_ID}:${USER_ID}`,
    );
  });

  it('filters open opp value by scopedOwnerId when agent', async () => {
    mocks.opportunityGroupBy.mockResolvedValue([
      { currency: 'USD', _count: { id: 2 }, _sum: { amount: 5000 } },
    ]);

    const query = new GetDashboardSummaryQuery(TENANT_ID, USER_ID, USER_ID);
    const result = await handler.execute(query);

    const firstCall = mocks.opportunityGroupBy.mock.calls[0] as [
      { where: { ownerId?: string } },
    ];
    const callArgs = firstCall[0];
    expect(callArgs.where.ownerId).toBe(USER_ID);
    expect(result.openOpportunityValue[0]).toEqual({
      currency: 'USD',
      count: 2,
      totalAmount: 5000,
    });
  });

  it('does not filter by ownerId for tenant-wide query (admin/manager)', async () => {
    const query = new GetDashboardSummaryQuery(TENANT_ID, USER_ID, undefined);
    await handler.execute(query);

    const firstCall = mocks.opportunityGroupBy.mock.calls[0] as [
      { where: { ownerId?: string } },
    ];
    const callArgs = firstCall[0];
    expect(callArgs.where.ownerId).toBeUndefined();
  });

  it('maps funnel stages from default pipeline', async () => {
    mocks.pipelineFindFirst.mockResolvedValue({
      id: 'pipe-1',
      stages: [
        { id: 'stage-1', name: 'Lead', order: 1, type: 'OPEN' },
        { id: 'stage-2', name: 'Won', order: 2, type: 'WON' },
      ],
    });
    mocks.opportunityGroupBy
      .mockResolvedValueOnce([]) // open value
      .mockResolvedValueOnce([]) // closed won
      .mockResolvedValueOnce([
        {
          stageId: 'stage-1',
          currency: 'USD',
          _count: { id: 3 },
          _sum: { amount: 9000 },
        },
      ]);

    const query = new GetDashboardSummaryQuery(TENANT_ID, USER_ID, undefined);
    const result = await handler.execute(query);

    expect(result.funnelSnapshot).toHaveLength(2);
    expect(result.funnelSnapshot[0]).toMatchObject({
      stageId: 'stage-1',
      stageName: 'Lead',
      order: 1,
      stageType: 'OPEN',
      count: 3,
      totalAmountByCurrency: [{ currency: 'USD', total: 9000 }],
    });
    expect(result.funnelSnapshot[1]).toMatchObject({
      count: 0,
      totalAmountByCurrency: [],
    });
  });
});
