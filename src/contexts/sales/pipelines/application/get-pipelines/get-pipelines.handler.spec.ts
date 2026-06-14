import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { GetPipelinesQuery } from './get-pipelines.query';
import { GetPipelinesHandler } from './get-pipelines.handler';

const RAW_PIPELINE = {
  id: 'pipe-1',
  tenantId: 'tenant-1',
  name: 'Sales Pipeline',
  isDefault: true,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  stages: [
    { id: 'stage-1', name: 'Lead', order: 0, probability: 10, type: 'OPEN' },
  ],
};

const makePrisma = (rows: (typeof RAW_PIPELINE)[]) =>
  ({
    pipeline: { findMany: jest.fn().mockResolvedValue(rows) },
  }) as unknown as PrismaService;

describe('GetPipelinesHandler', () => {
  it('returns list of pipeline read models', async () => {
    const handler = new GetPipelinesHandler(makePrisma([RAW_PIPELINE]));
    const result = await handler.execute(new GetPipelinesQuery('tenant-1'));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('pipe-1');
  });

  it('returns empty array when no pipelines', async () => {
    const handler = new GetPipelinesHandler(makePrisma([]));
    const result = await handler.execute(new GetPipelinesQuery('tenant-1'));
    expect(result).toHaveLength(0);
  });
});
