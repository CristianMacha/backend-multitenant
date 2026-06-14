import { EntityNotFoundException } from '@shared/exceptions';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { GetPipelineByIdQuery } from './get-pipeline-by-id.query';
import { GetPipelineByIdHandler } from './get-pipeline-by-id.handler';

const RAW = {
  id: 'pipe-1',
  tenantId: 'tenant-1',
  name: 'Sales Pipeline',
  isDefault: false,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  stages: [
    { id: 'stage-1', name: 'Lead', order: 0, probability: 10, type: 'OPEN' },
  ],
};

const makePrisma = (row: typeof RAW | null) =>
  ({
    pipeline: { findFirst: jest.fn().mockResolvedValue(row) },
  }) as unknown as PrismaService;

describe('GetPipelineByIdHandler', () => {
  it('returns pipeline read model with stages', async () => {
    const handler = new GetPipelineByIdHandler(makePrisma(RAW));
    const result = await handler.execute(
      new GetPipelineByIdQuery('pipe-1', 'tenant-1'),
    );
    expect(result.id).toBe('pipe-1');
    expect(result.stages).toHaveLength(1);
  });

  it('throws EntityNotFoundException when not found', async () => {
    const handler = new GetPipelineByIdHandler(makePrisma(null));
    await expect(
      handler.execute(new GetPipelineByIdQuery('missing', 'tenant-1')),
    ).rejects.toThrow(EntityNotFoundException);
  });
});
