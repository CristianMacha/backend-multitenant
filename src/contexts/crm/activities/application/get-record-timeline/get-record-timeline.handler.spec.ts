import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { GetRecordTimelineQuery } from './get-record-timeline.query';
import { GetRecordTimelineHandler } from './get-record-timeline.handler';

const RAW_ACTIVITY = {
  id: 'act-1',
  tenantId: 'tenant-1',
  type: 'SYSTEM',
  subject: 'Opportunity created',
  body: null,
  dueAt: null,
  completedAt: null,
  status: 'PENDING',
  ownerId: null,
  source: 'SYSTEM',
  relatedToType: 'ACCOUNT',
  relatedToId: 'acct-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const makePrisma = (rows: (typeof RAW_ACTIVITY)[]) =>
  ({
    activity: { findMany: jest.fn().mockResolvedValue(rows) },
  }) as unknown as PrismaService;

describe('GetRecordTimelineHandler', () => {
  it('returns activities for the related record', async () => {
    const handler = new GetRecordTimelineHandler(makePrisma([RAW_ACTIVITY]));
    const result = await handler.execute(
      new GetRecordTimelineQuery('tenant-1', 'ACCOUNT', 'acct-1'),
    );
    expect(result).toHaveLength(1);
    expect(result[0].relatedToType).toBe('ACCOUNT');
  });

  it('returns empty array when no activities found', async () => {
    const handler = new GetRecordTimelineHandler(makePrisma([]));
    const result = await handler.execute(
      new GetRecordTimelineQuery('tenant-1', 'ACCOUNT', 'acct-1'),
    );
    expect(result).toHaveLength(0);
  });
});
