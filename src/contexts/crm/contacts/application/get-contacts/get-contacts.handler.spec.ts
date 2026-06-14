import { Test, TestingModule } from '@nestjs/testing';
import { GetContactsHandler } from './get-contacts.handler';
import { GetContactsQuery } from './get-contacts.query';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

const TENANT_ID = 'tenant-1';
const USER_ID = 'user-1';
const ACCOUNT_ID = 'account-1';

function makeMocks() {
  const findMany = jest.fn().mockResolvedValue([]);
  const count = jest.fn().mockResolvedValue(0);
  const $transaction = jest
    .fn()
    .mockImplementation(async (ops: unknown[]) =>
      Promise.all((ops as Promise<unknown>[]).map((op) => op)),
    );

  const prisma = {
    contact: { findMany, count },
    $transaction,
  } as unknown as PrismaService;

  return { prisma, findMany, count };
}

describe('GetContactsHandler', () => {
  let handler: GetContactsHandler;
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(async () => {
    mocks = makeMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetContactsHandler,
        { provide: PrismaService, useValue: mocks.prisma },
      ],
    }).compile();

    handler = module.get(GetContactsHandler);
  });

  it('returns paginated empty result for tenant', async () => {
    const query = new GetContactsQuery(TENANT_ID, 1, 20);
    const result = await handler.execute(query);

    expect(result.items).toEqual([]);
    expect(result.meta.total).toBe(0);
  });

  it('does not filter by ownerId when scopedOwnerId is undefined (admin/manager)', async () => {
    const query = new GetContactsQuery(
      TENANT_ID,
      1,
      20,
      undefined,
      undefined,
      undefined,
    );
    await handler.execute(query);

    const [callArg] = mocks.findMany.mock.calls[0] as [
      { where: { ownerId?: string } },
    ];
    expect(callArg.where.ownerId).toBeUndefined();
  });

  it('filters by ownerId when scopedOwnerId is set (agent)', async () => {
    const query = new GetContactsQuery(
      TENANT_ID,
      1,
      20,
      undefined,
      undefined,
      USER_ID,
    );
    await handler.execute(query);

    const [callArg] = mocks.findMany.mock.calls[0] as [
      { where: { ownerId?: string } },
    ];
    expect(callArg.where.ownerId).toBe(USER_ID);
  });

  it('filters by both accountId and scopedOwnerId simultaneously', async () => {
    const query = new GetContactsQuery(
      TENANT_ID,
      1,
      20,
      undefined,
      ACCOUNT_ID,
      USER_ID,
    );
    await handler.execute(query);

    const [callArg] = mocks.findMany.mock.calls[0] as [
      { where: { ownerId?: string; accountId?: string } },
    ];
    expect(callArg.where.ownerId).toBe(USER_ID);
    expect(callArg.where.accountId).toBe(ACCOUNT_ID);
  });
});
