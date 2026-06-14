import { Test, TestingModule } from '@nestjs/testing';
import { EntityNotFoundException } from '@shared/exceptions';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { GetProductByIdHandler } from './get-product-by-id.handler';
import { GetProductByIdQuery } from './get-product-by-id.query';

const TENANT_ID = 'tenant-1';
const PRODUCT_ID = 'prod-1';

const rawProduct = {
  id: PRODUCT_ID,
  tenantId: TENANT_ID,
  name: 'Widget Pro',
  description: null,
  type: 'PRODUCT',
  category: null,
  unitPrice: 99.99,
  currency: 'USD',
  unitOfMeasure: 'unit',
  status: 'ACTIVE',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
};

function makeMocks(product: unknown = rawProduct) {
  const findFirst = jest.fn().mockResolvedValue(product);
  const prisma = {
    product: { findFirst },
  } as unknown as PrismaService;
  return { prisma, findFirst };
}

describe('GetProductByIdHandler', () => {
  let handler: GetProductByIdHandler;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(async () => {
    mocks = makeMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductByIdHandler,
        { provide: PrismaService, useValue: mocks.prisma },
      ],
    }).compile();

    handler = module.get(GetProductByIdHandler);
  });

  it('returns the product read model for a valid id (R14)', async () => {
    const result = await handler.execute(
      new GetProductByIdQuery(PRODUCT_ID, TENANT_ID),
    );

    expect(result.id).toBe(PRODUCT_ID);
    expect(result.name).toBe('Widget Pro');
    expect(result.unitPrice).toEqual({ amount: 99.99, currency: 'USD' });
    expect(result.tenantId).toBe(TENANT_ID);
  });

  it('filters by tenantId and deletedAt: null (R9)', async () => {
    await handler.execute(new GetProductByIdQuery(PRODUCT_ID, TENANT_ID));

    const [callArg] = mocks.findFirst.mock.calls[0] as [
      { where: { id: string; tenantId: string; deletedAt: null } },
    ];
    expect(callArg.where.id).toBe(PRODUCT_ID);
    expect(callArg.where.tenantId).toBe(TENANT_ID);
    expect(callArg.where.deletedAt).toBeNull();
  });

  it('throws EntityNotFoundException when product not found (R15)', async () => {
    mocks = makeMocks(null);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductByIdHandler,
        { provide: PrismaService, useValue: mocks.prisma },
      ],
    }).compile();
    handler = module.get(GetProductByIdHandler);

    await expect(
      handler.execute(new GetProductByIdQuery('nonexistent', TENANT_ID)),
    ).rejects.toThrow(EntityNotFoundException);
  });

  it('throws EntityNotFoundException for soft-deleted product (R15)', async () => {
    // soft-deleted products have deletedAt set, so findFirst returns null
    // (the query filters deletedAt: null)
    mocks = makeMocks(null);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetProductByIdHandler,
        { provide: PrismaService, useValue: mocks.prisma },
      ],
    }).compile();
    handler = module.get(GetProductByIdHandler);

    await expect(
      handler.execute(new GetProductByIdQuery(PRODUCT_ID, TENANT_ID)),
    ).rejects.toThrow(EntityNotFoundException);
  });
});
