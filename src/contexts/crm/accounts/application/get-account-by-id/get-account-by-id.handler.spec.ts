import { EntityNotFoundException } from '@shared/exceptions';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { GetAccountByIdQuery } from './get-account-by-id.query';
import { GetAccountByIdHandler } from './get-account-by-id.handler';

const RAW = {
  id: 'acct-1',
  tenantId: 'tenant-1',
  name: 'Acme',
  industry: null,
  website: null,
  phone: null,
  address: null,
  ownerId: 'owner-1',
  status: 'ACTIVE',
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const makePrisma = (row: typeof RAW | null) =>
  ({
    account: { findFirst: jest.fn().mockResolvedValue(row) },
  }) as unknown as PrismaService;

describe('GetAccountByIdHandler', () => {
  it('returns account read model', async () => {
    const handler = new GetAccountByIdHandler(makePrisma(RAW));
    const result = await handler.execute(
      new GetAccountByIdQuery('acct-1', 'tenant-1'),
    );
    expect(result.id).toBe('acct-1');
    expect(result.name).toBe('Acme');
  });

  it('throws EntityNotFoundException when not found', async () => {
    const handler = new GetAccountByIdHandler(makePrisma(null));
    await expect(
      handler.execute(new GetAccountByIdQuery('missing', 'tenant-1')),
    ).rejects.toThrow(EntityNotFoundException);
  });
});
