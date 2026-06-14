import { DomainException } from '@shared/exceptions';
import { TenantId, UserId } from '@shared/domain/types';
import { Notification } from './notification.entity';
import { NotificationCreatedEvent } from '../events/notification.events';

const TENANT_ID = TenantId('tenant-uuid');
const USER_ID = UserId('user-uuid');

describe('Notification entity', () => {
  describe('create', () => {
    it('creates with read=false and readAt=undefined (R2)', () => {
      const notification = Notification.create({
        tenantId: TENANT_ID,
        userId: USER_ID,
        type: 'GENERIC',
        title: 'Hello',
        body: 'World',
      });

      expect(notification.read).toBe(false);
      expect(notification.readAt).toBeUndefined();
      expect(notification.id).toBeDefined();
    });

    it('emits NotificationCreatedEvent on create (R6)', () => {
      const notification = Notification.create({
        tenantId: TENANT_ID,
        userId: USER_ID,
        type: 'ACTIVITY_REMINDER',
        title: 'Reminder',
        body: 'Activity is due',
      });

      const events = notification.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(NotificationCreatedEvent);
    });

    it('trims title and body before validation (R8)', () => {
      const notification = Notification.create({
        tenantId: TENANT_ID,
        userId: USER_ID,
        type: 'GENERIC',
        title: '  Test  ',
        body: '  Body text  ',
      });

      expect(notification.title).toBe('Test');
      expect(notification.body).toBe('Body text');
    });

    it('throws DomainException when title is empty (R8)', () => {
      expect(() =>
        Notification.create({
          tenantId: TENANT_ID,
          userId: USER_ID,
          type: 'GENERIC',
          title: '   ',
          body: 'valid body',
        }),
      ).toThrow(DomainException);
    });

    it('throws DomainException when body is empty (R8)', () => {
      expect(() =>
        Notification.create({
          tenantId: TENANT_ID,
          userId: USER_ID,
          type: 'GENERIC',
          title: 'Valid title',
          body: '',
        }),
      ).toThrow(DomainException);
    });
  });

  describe('markAsRead', () => {
    it('sets read=true and readAt when called on an unread notification (R16)', () => {
      const notification = Notification.create({
        tenantId: TENANT_ID,
        userId: USER_ID,
        type: 'GENERIC',
        title: 'Title',
        body: 'Body',
      });

      notification.pullDomainEvents(); // clear events from create
      notification.markAsRead();

      expect(notification.read).toBe(true);
      expect(notification.readAt).toBeInstanceOf(Date);
    });

    it('is idempotent — does not change readAt when already read (R18)', () => {
      const notification = Notification.create({
        tenantId: TENANT_ID,
        userId: USER_ID,
        type: 'GENERIC',
        title: 'Title',
        body: 'Body',
      });
      notification.pullDomainEvents();
      notification.markAsRead();
      const firstReadAt = notification.readAt;

      // Call markAsRead again — should not change readAt
      notification.markAsRead();

      expect(notification.read).toBe(true);
      expect(notification.readAt).toBe(firstReadAt); // same reference
    });
  });

  describe('fromPersistence', () => {
    it('rehydrates without emitting events', () => {
      const notification = Notification.fromPersistence({
        id: 'some-id',
        tenantId: TENANT_ID,
        userId: USER_ID,
        type: 'SYSTEM',
        title: 'Persisted',
        body: 'From DB',
        read: true,
        readAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      });

      expect(notification.id).toBe('some-id');
      expect(notification.read).toBe(true);
      expect(notification.pullDomainEvents()).toHaveLength(0);
    });
  });
});
