import { Test, TestingModule } from '@nestjs/testing';
import { GetProductsHandler } from './get-products.handler';
import { GetProductsQuery } from './get-products.query';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

const TENANT_ID = 'tenant-1';

function makeMocks() {
  const findMany = jest.fn().mockResolvedValue([]);
  const count = jest.fn().mockResolvedValue(0);
  const $transaction = jest
    .fn()
    .mockImplementation(async (ops: unknown[]) =>
      Promise.all((ops as Promise<unknown>[]).map((op) => op)),
    );

  const prisma = {
    product: { findMany, count },
    $transaction,
  } as unknown as PrismaService;

  return { prisma, findMany, count };
}

describe('GetProductsHandler', () => {
  let handler: GetProductsHandler;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(async () => {
    mocks = makeMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductsHandler,
        { provide: PrismaService, useValue: mocks.prisma },
      ],
    }).compile();

    handler = module.get(GetProductsHandler);
  });

  it('returns paginated empty result for tenant (R8)', async () => {
    const result = await handler.execute(
      new GetProductsQuery(TENANT_ID, 1, 20),
    );

    expect(result.items).toEqual([]);
    expect(result.meta.total).toBe(0);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(20);
  });

  it('always filters by tenantId and deletedAt: null (R9)', async () => {
    await handler.execute(new GetProductsQuery(TENANT_ID, 1, 20));

    const [callArg] = mocks.findMany.mock.calls[0] as [
      { where: { tenantId: string; deletedAt: null } },
    ];
    expect(callArg.where.tenantId).toBe(TENANT_ID);
    expect(callArg.where.deletedAt).toBeNull();
  });

  it('filters by type when provided (R10)', async () => {
    await handler.execute(new GetProductsQuery(TENANT_ID, 1, 20, 'PRODUCT'));

    const [callArg] = mocks.findMany.mock.calls[0] as [
      { where: { type?: string } },
    ];
    expect(callArg.where.type).toBe('PRODUCT');
  });

  it('does not add type filter when type is undefined', async () => {
    await handler.execute(new GetProductsQuery(TENANT_ID, 1, 20));

    const [callArg] = mocks.findMany.mock.calls[0] as [
      { where: { type?: string } },
    ];
    expect(callArg.where.type).toBeUndefined();
  });

  it('filters by category when provided (R11)', async () => {
    await handler.execute(
      new GetProductsQuery(TENANT_ID, 1, 20, undefined, 'Software'),
    );

    const [callArg] = mocks.findMany.mock.calls[0] as [
      { where: { category?: string } },
    ];
    expect(callArg.where.category).toBe('Software');
  });

  it('filters by status when provided (R12)', async () => {
    await handler.execute(
      new GetProductsQuery(TENANT_ID, 1, 20, undefined, undefined, 'ACTIVE'),
    );

    const [callArg] = mocks.findMany.mock.calls[0] as [
      { where: { status?: string } },
    ];
    expect(callArg.where.status).toBe('ACTIVE');
  });

  it('applies pagination skip correctly', async () => {
    await handler.execute(new GetProductsQuery(TENANT_ID, 3, 10));

    const [callArg] = mocks.findMany.mock.calls[0] as [
      { skip: number; take: number },
    ];
    expect(callArg.skip).toBe(20);
    expect(callArg.take).toBe(10);
  });
});
