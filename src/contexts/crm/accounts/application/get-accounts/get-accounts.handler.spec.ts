import { Test, TestingModule } from '@nestjs/testing';
import { GetAccountsHandler } from './get-accounts.handler';
import { GetAccountsQuery } from './get-accounts.query';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

const TENANT_ID = 'tenant-1';
const USER_ID = 'user-1';

function makeMocks() {
  const findMany = jest.fn().mockResolvedValue([]);
  const count = jest.fn().mockResolvedValue(0);
  const $transaction = jest
    .fn()
    .mockImplementation(async (ops: unknown[]) =>
      Promise.all((ops as Promise<unknown>[]).map((op) => op)),
    );

  const prisma = {
    account: { findMany, count },
    $transaction,
  } as unknown as PrismaService;

  return { prisma, findMany, count };
}

describe('GetAccountsHandler', () => {
  let handler: GetAccountsHandler;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(async () => {
    mocks = makeMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetAccountsHandler,
        { provide: PrismaService, useValue: mocks.prisma },
      ],
    }).compile();

    handler = module.get(GetAccountsHandler);
  });

  it('returns paginated empty result for tenant', async () => {
    const query = new GetAccountsQuery(TENANT_ID, 1, 20);
    const result = await handler.execute(query);

    expect(result.items).toEqual([]);
    expect(result.meta.total).toBe(0);
  });

  it('does not filter by ownerId when scopedOwnerId is undefined (admin/manager)', async () => {
    const query = new GetAccountsQuery(TENANT_ID, 1, 20, undefined, undefined);
    await handler.execute(query);

    const [callArg] = mocks.findMany.mock.calls[0] as [
      { where: { ownerId?: string } },
    ];
    expect(callArg.where.ownerId).toBeUndefined();
  });

  it('filters by ownerId when scopedOwnerId is set (agent)', async () => {
    const query = new GetAccountsQuery(TENANT_ID, 1, 20, undefined, USER_ID);
    await handler.execute(query);

    const [callArg] = mocks.findMany.mock.calls[0] as [
      { where: { ownerId?: string } },
    ];
    expect(callArg.where.ownerId).toBe(USER_ID);
  });

  it('applies search filter alongside owner scope', async () => {
    const query = new GetAccountsQuery(TENANT_ID, 1, 20, 'Acme', USER_ID);
    await handler.execute(query);

    const [callArg] = mocks.findMany.mock.calls[0] as [
      { where: { ownerId?: string; OR?: unknown[] } },
    ];
    expect(callArg.where.ownerId).toBe(USER_ID);
    expect(callArg.where.OR).toBeDefined();
  });
});
