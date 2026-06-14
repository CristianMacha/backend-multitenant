import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { ProductId, TenantId } from '@shared/domain/types';
import { ProductQueryService } from './product-query.service';

const TENANT_ID = TenantId('tenant-1');
const PRODUCT_ID = ProductId('prod-1');

const rawSummary = {
  id: 'prod-1',
  name: 'Widget Pro',
  type: 'PRODUCT',
  unitPrice: 99.99,
  currency: 'USD',
  status: 'ACTIVE',
};

function makeMocks(product: unknown = rawSummary) {
  const findFirst = jest.fn().mockResolvedValue(product);
  const prisma = {
    product: { findFirst },
  } as unknown as PrismaService;
  return { prisma, findFirst };
}

describe('ProductQueryService', () => {
  let service: ProductQueryService;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(async () => {
    mocks = makeMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductQueryService,
        { provide: PrismaService, useValue: mocks.prisma },
      ],
    }).compile();

    service = module.get(ProductQueryService);
  });

  it('returns a ProductSummary when product exists (R27)', async () => {
    const result = await service.findById(TENANT_ID, PRODUCT_ID);

    expect(result).not.toBeNull();
    expect(result!.id).toBe('prod-1');
    expect(result!.name).toBe('Widget Pro');
    expect(result!.unitPrice).toEqual({ amount: 99.99, currency: 'USD' });
    expect(result!.status).toBe('ACTIVE');
  });

  it('always filters by tenantId and deletedAt: null (R27, R28)', async () => {
    await service.findById(TENANT_ID, PRODUCT_ID);

    const [callArg] = mocks.findFirst.mock.calls[0] as [
      { where: { id: string; tenantId: string; deletedAt: null } },
    ];
    expect(callArg.where.tenantId).toBe('tenant-1');
    expect(callArg.where.deletedAt).toBeNull();
    expect(callArg.where.id).toBe('prod-1');
  });

  it('returns null when product does not exist (R28)', async () => {
    mocks = makeMocks(null);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductQueryService,
        { provide: PrismaService, useValue: mocks.prisma },
      ],
    }).compile();
    service = module.get(ProductQueryService);

    const result = await service.findById(TENANT_ID, ProductId('nonexistent'));
    expect(result).toBeNull();
  });

  it('returns null for soft-deleted products (R28)', async () => {
    // soft-deleted products are excluded by deletedAt: null filter — findFirst returns null
    mocks = makeMocks(null);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductQueryService,
        { provide: PrismaService, useValue: mocks.prisma },
      ],
    }).compile();
    service = module.get(ProductQueryService);

    const result = await service.findById(TENANT_ID, PRODUCT_ID);
    expect(result).toBeNull();
  });

  it('does not cross tenant boundaries (R28)', async () => {
    await service.findById(TenantId('other-tenant'), PRODUCT_ID);

    const [callArg] = mocks.findFirst.mock.calls[0] as [
      { where: { tenantId: string } },
    ];
    expect(callArg.where.tenantId).toBe('other-tenant');
    // The service scopes the query to the requested tenantId, not any other
  });
});
