import { NotificationRepository } from '../../domain/repositories/notification.repository';
import { MarkAllNotificationsReadCommand } from './mark-all-notifications-read.command';
import { MarkAllNotificationsReadHandler } from './mark-all-notifications-read.handler';

const TENANT_ID = 'tenant-uuid';
const USER_ID = 'user-uuid';

const makeMocks = (updatedCount = 5) => {
  const markAllAsRead = jest
    .fn()
    .mockResolvedValue(updatedCount) as jest.MockedFunction<
    NotificationRepository['markAllAsRead']
  >;

  const repo: NotificationRepository = {
    findById: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockResolvedValue(undefined),
    markAllAsRead,
  };

  return { repo, markAllAsRead };
};

describe('MarkAllNotificationsReadHandler', () => {
  it('calls markAllAsRead with tenantId and userId and returns the count (R19, R20)', async () => {
    const { repo, markAllAsRead } = makeMocks(3);
    const handler = new MarkAllNotificationsReadHandler(repo);

    const result = await handler.execute(
      new MarkAllNotificationsReadCommand(TENANT_ID, USER_ID),
    );

    expect(markAllAsRead).toHaveBeenCalledTimes(1);
    expect(markAllAsRead).toHaveBeenCalledWith(TENANT_ID, USER_ID);
    expect(result).toEqual({ updated: 3 });
  });

  it('returns { updated: 0 } when there are no unread notifications (R19)', async () => {
    const { repo } = makeMocks(0);
    const handler = new MarkAllNotificationsReadHandler(repo);

    const result = await handler.execute(
      new MarkAllNotificationsReadCommand(TENANT_ID, USER_ID),
    );

    expect(result).toEqual({ updated: 0 });
  });

  it('passes the correct tenantId and userId to scope the operation (R24)', async () => {
    const { repo, markAllAsRead } = makeMocks(1);
    const handler = new MarkAllNotificationsReadHandler(repo);

    await handler.execute(
      new MarkAllNotificationsReadCommand('specific-tenant', 'specific-user'),
    );

    expect(markAllAsRead).toHaveBeenCalledWith(
      'specific-tenant',
      'specific-user',
    );
  });
});
