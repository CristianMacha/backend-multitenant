import { EntityNotFoundException } from '@shared/exceptions';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { GetOpportunityByIdQuery } from './get-opportunity-by-id.query';
import { GetOpportunityByIdHandler } from './get-opportunity-by-id.handler';

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

const makePrisma = (row: typeof RAW | null) =>
  ({
    opportunity: { findFirst: jest.fn().mockResolvedValue(row) },
  }) as unknown as PrismaService;

describe('GetOpportunityByIdHandler', () => {
  it('returns opportunity read model', async () => {
    const handler = new GetOpportunityByIdHandler(makePrisma(RAW));
    const result = await handler.execute(
      new GetOpportunityByIdQuery('opp-1', 'tenant-1'),
    );
    expect(result.id).toBe('opp-1');
    expect(result.name).toBe('Deal A');
  });

  it('throws EntityNotFoundException when not found', async () => {
    const handler = new GetOpportunityByIdHandler(makePrisma(null));
    await expect(
      handler.execute(new GetOpportunityByIdQuery('missing', 'tenant-1')),
    ).rejects.toThrow(EntityNotFoundException);
  });
});
