import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { GetOpportunitiesQuery } from './get-opportunities.query';
import { GetOpportunitiesHandler } from './get-opportunities.handler';

const RAW = {
  id: 'opp-1',
  tenantId: 'tenant-1',
  name: 'Deal A',
  accountId: 'acct-1',
  contactId: null,
  pipelineId: 'pipe-1',
  stageId: 'stage-1',
  amount: { toNumber: () => 5000 } as unknown as number,
  currency: 'USD',
  ownerId: 'owner-1',
  status: 'OPEN',
  closedAt: null,
  expectedCloseDate: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const makePrisma = (rows: (typeof RAW)[], total: number) =>
  ({
    opportunity: {
      findMany: jest.fn().mockResolvedValue(rows),
      count: jest.fn().mockResolvedValue(total),
    },
    $transaction: jest
      .fn()
      .mockImplementation((arr: Promise<unknown>[]) => Promise.all(arr)),
  }) as unknown as PrismaService;

describe('GetOpportunitiesHandler', () => {
  it('returns paginated result', async () => {
    const handler = new GetOpportunitiesHandler(makePrisma([RAW], 1));
    const result = await handler.execute(
      new GetOpportunitiesQuery('tenant-1', 1, 10),
    );
    expect(result.items).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('returns empty page when no results', async () => {
    const handler = new GetOpportunitiesHandler(makePrisma([], 0));
    const result = await handler.execute(
      new GetOpportunitiesQuery('tenant-1', 1, 10),
    );
    expect(result.items).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });

  it('filters by all optional params when provided', async () => {
    const handler = new GetOpportunitiesHandler(makePrisma([RAW], 1));
    const result = await handler.execute(
      new GetOpportunitiesQuery(
        'tenant-1',
        1,
        10,
        'Deal',
        'pipe-1',
        'stage-1',
        'owner-1',
        'OPEN',
      ),
    );
    expect(result.items).toHaveLength(1);
  });
});
