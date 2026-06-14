import { NotificationMapper } from './notification.mapper';
import { Notification } from '../../domain/entities/notification.entity';
import { TenantId, UserId } from '@shared/domain/types';

const now = new Date('2024-01-01T00:00:00.000Z');

const rawNotification = {
  id: 'notif-id',
  tenantId: 'tenant-id',
  userId: 'user-id',
  type: 'GENERIC' as const,
  title: 'Test notification',
  body: 'Test body',
  read: false,
  readAt: null,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
};

describe('NotificationMapper', () => {
  describe('toDomain', () => {
    it('maps a Prisma row to a Notification aggregate', () => {
      const notification = NotificationMapper.toDomain(rawNotification);

      expect(notification).toBeInstanceOf(Notification);
      expect(notification.id).toBe('notif-id');
      expect(notification.tenantId).toBe('tenant-id');
      expect(notification.userId).toBe('user-id');
      expect(notification.type).toBe('GENERIC');
      expect(notification.title).toBe('Test notification');
      expect(notification.body).toBe('Test body');
      expect(notification.read).toBe(false);
      expect(notification.readAt).toBeUndefined();
    });

    it('maps readAt when present', () => {
      const readAt = new Date('2024-06-01T10:00:00.000Z');
      const notification = NotificationMapper.toDomain({
        ...rawNotification,
        read: true,
        readAt,
      });

      expect(notification.read).toBe(true);
      expect(notification.readAt).toEqual(readAt);
    });

    it('does not emit domain events during rehydration', () => {
      const notification = NotificationMapper.toDomain(rawNotification);
      expect(notification.pullDomainEvents()).toHaveLength(0);
    });
  });

  describe('toPersistence', () => {
    it('maps a Notification aggregate to Prisma create input', () => {
      const notification = Notification.fromPersistence({
        id: 'notif-id',
        tenantId: TenantId('tenant-id'),
        userId: UserId('user-id'),
        type: 'SYSTEM',
        title: 'System alert',
        body: 'Something happened',
        read: false,
        readAt: undefined,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      });

      const data = NotificationMapper.toPersistence(notification);

      expect(data.id).toBe('notif-id');
      expect(data.tenantId).toBe('tenant-id');
      expect(data.userId).toBe('user-id');
      expect(data.type).toBe('SYSTEM');
      expect(data.title).toBe('System alert');
      expect(data.body).toBe('Something happened');
      expect(data.read).toBe(false);
      expect(data.readAt).toBeNull();
    });
  });
});
