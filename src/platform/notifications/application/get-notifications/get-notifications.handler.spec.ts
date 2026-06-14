import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { GetNotificationsQuery } from './get-notifications.query';
import { GetNotificationsHandler } from './get-notifications.handler';

const TENANT_ID = 'tenant-uuid';
const USER_ID = 'user-uuid';

const makeRawNotification = (overrides: Record<string, unknown> = {}) => ({
  id: 'notif-id',
  tenantId: TENANT_ID,
  userId: USER_ID,
  type: 'GENERIC',
  title: 'Test',
  body: 'Body',
  read: false,
  readAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

const makeMocks = (
  items: ReturnType<typeof makeRawNotification>[] = [],
  total = 0,
) => {
  const findMany = jest.fn().mockResolvedValue(items);
  const count = jest.fn().mockResolvedValue(total);
  const $transaction = jest
    .fn()
    .mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));

  const prisma = {
    notification: { findMany, count },
    $transaction,
  } as unknown as PrismaService;

  return { prisma, findMany, count };
};

describe('GetNotificationsHandler', () => {
  it('returns a paginated list of notifications (R12, R13)', async () => {
    const raw = makeRawNotification();
    const { prisma, findMany } = makeMocks([raw], 1);
    const handler = new GetNotificationsHandler(prisma);

    const result = await handler.execute(
      new GetNotificationsQuery(TENANT_ID, USER_ID, 1, 20),
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('notif-id');
    expect(result.meta.total).toBe(1);
    expect(findMany).toHaveBeenCalledTimes(1);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: TENANT_ID, userId: USER_ID, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      }),
    );
  });

  it('passes tenantId, userId, and deletedAt:null in where clause (R13, R24)', async () => {
    const { prisma, findMany } = makeMocks([], 0);
    const handler = new GetNotificationsHandler(prisma);

    await handler.execute(new GetNotificationsQuery(TENANT_ID, USER_ID, 1, 20));

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: TENANT_ID, userId: USER_ID, deletedAt: null },
      }),
    );
  });

  it('orders results by createdAt desc (R14)', async () => {
    const { prisma, findMany } = makeMocks([], 0);
    const handler = new GetNotificationsHandler(prisma);

    await handler.execute(new GetNotificationsQuery(TENANT_ID, USER_ID, 1, 20));

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
    );
  });

  it('applies pagination with skip and take (R15)', async () => {
    const { prisma, findMany } = makeMocks([], 0);
    const handler = new GetNotificationsHandler(prisma);

    await handler.execute(new GetNotificationsQuery(TENANT_ID, USER_ID, 3, 10));

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 20, // (3-1)*10
        take: 10,
      }),
    );
  });

  it('returns correct pagination meta (R15)', async () => {
    const items = [makeRawNotification(), makeRawNotification({ id: 'id-2' })];
    const { prisma } = makeMocks(items, 25);
    const handler = new GetNotificationsHandler(prisma);

    const result = await handler.execute(
      new GetNotificationsQuery(TENANT_ID, USER_ID, 2, 10),
    );

    expect(result.meta.page).toBe(2);
    expect(result.meta.limit).toBe(10);
    expect(result.meta.total).toBe(25);
    expect(result.meta.totalPages).toBe(3);
  });
});
