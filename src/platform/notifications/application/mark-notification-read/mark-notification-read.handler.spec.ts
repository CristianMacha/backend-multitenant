import { EntityNotFoundException } from '@shared/exceptions';
import { TenantId, UserId } from '@shared/domain/types';
import { Notification } from '../../domain/entities/notification.entity';
import { NotificationRepository } from '../../domain/repositories/notification.repository';
import { MarkNotificationReadCommand } from './mark-notification-read.command';
import { MarkNotificationReadHandler } from './mark-notification-read.handler';

const TENANT_ID = 'tenant-uuid';
const USER_ID = 'user-uuid';
const NOTIFICATION_ID = 'notif-uuid';

const makeNotification = (
  overrides: { read?: boolean; userId?: string } = {},
) =>
  Notification.fromPersistence({
    id: NOTIFICATION_ID,
    tenantId: TenantId(TENANT_ID),
    userId: UserId(overrides.userId ?? USER_ID),
    type: 'GENERIC',
    title: 'Test',
    body: 'Body',
    read: overrides.read ?? false,
    readAt: overrides.read ? new Date() : undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  });

const makeMocks = () => {
  const save = jest
    .fn<Promise<void>, Parameters<NotificationRepository['save']>>()
    .mockResolvedValue(undefined);
  const findById = jest.fn().mockResolvedValue(null) as jest.MockedFunction<
    NotificationRepository['findById']
  >;

  const repo: NotificationRepository = {
    findById,
    save,
    markAllAsRead: jest.fn().mockResolvedValue(0),
  };

  return { repo, save, findById };
};

describe('MarkNotificationReadHandler', () => {
  it('marks an unread notification as read and saves it (R16)', async () => {
    const { repo, save, findById } = makeMocks();
    const notification = makeNotification({ read: false });
    findById.mockResolvedValue(notification);

    const handler = new MarkNotificationReadHandler(repo);
    await handler.execute(
      new MarkNotificationReadCommand(NOTIFICATION_ID, TENANT_ID, USER_ID),
    );

    expect(notification.read).toBe(true);
    expect(notification.readAt).toBeInstanceOf(Date);
    expect(save).toHaveBeenCalledWith(notification);
  });

  it('throws EntityNotFoundException when notification does not exist (R17)', async () => {
    const { repo, findById } = makeMocks();
    findById.mockResolvedValue(null);

    const handler = new MarkNotificationReadHandler(repo);

    await expect(
      handler.execute(
        new MarkNotificationReadCommand(NOTIFICATION_ID, TENANT_ID, USER_ID),
      ),
    ).rejects.toThrow(EntityNotFoundException);
  });

  it('throws EntityNotFoundException when notification belongs to another user (R17, R24)', async () => {
    const { repo, findById } = makeMocks();
    const notification = makeNotification({ userId: 'another-user' });
    findById.mockResolvedValue(notification);

    const handler = new MarkNotificationReadHandler(repo);

    await expect(
      handler.execute(
        new MarkNotificationReadCommand(NOTIFICATION_ID, TENANT_ID, USER_ID),
      ),
    ).rejects.toThrow(EntityNotFoundException);
  });

  it('is idempotent — saves even when already read, does not change readAt (R18)', async () => {
    const { repo, save, findById } = makeMocks();
    const notification = makeNotification({ read: true });
    const originalReadAt = notification.readAt;
    findById.mockResolvedValue(notification);

    const handler = new MarkNotificationReadHandler(repo);
    await handler.execute(
      new MarkNotificationReadCommand(NOTIFICATION_ID, TENANT_ID, USER_ID),
    );

    expect(notification.read).toBe(true);
    expect(notification.readAt).toBe(originalReadAt); // unchanged
    expect(save).toHaveBeenCalledTimes(1); // still saves (idempotent)
  });
});
