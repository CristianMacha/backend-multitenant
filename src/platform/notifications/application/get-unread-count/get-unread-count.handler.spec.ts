import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { GetUnreadCountQuery } from './get-unread-count.query';
import { GetUnreadCountHandler } from './get-unread-count.handler';

const TENANT_ID = 'tenant-uuid';
const USER_ID = 'user-uuid';

const makeMocks = (countValue = 0) => {
  const count = jest.fn().mockResolvedValue(countValue);
  const prisma = {
    notification: { count },
  } as unknown as PrismaService;
  return { prisma, count };
};

describe('GetUnreadCountHandler', () => {
  it('returns the count of unread notifications (R21)', async () => {
    const { prisma } = makeMocks(7);
    const handler = new GetUnreadCountHandler(prisma);

    const result = await handler.execute(
      new GetUnreadCountQuery(TENANT_ID, USER_ID),
    );

    expect(result).toBe(7);
  });

  it('filters by tenantId, userId, read=false, deletedAt=null (R21, R24)', async () => {
    const { prisma, count } = makeMocks(0);
    const handler = new GetUnreadCountHandler(prisma);

    await handler.execute(new GetUnreadCountQuery(TENANT_ID, USER_ID));

    expect(count).toHaveBeenCalledWith({
      where: {
        tenantId: TENANT_ID,
        userId: USER_ID,
        read: false,
        deletedAt: null,
      },
    });
  });

  it('returns 0 when all notifications are read (R21)', async () => {
    const { prisma } = makeMocks(0);
    const handler = new GetUnreadCountHandler(prisma);

    const result = await handler.execute(
      new GetUnreadCountQuery(TENANT_ID, USER_ID),
    );

    expect(result).toBe(0);
  });
});
