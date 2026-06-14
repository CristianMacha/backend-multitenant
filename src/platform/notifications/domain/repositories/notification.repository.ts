import { DomainEvent } from '@shared/domain/domain-event.base';
import { NotificationId, TenantId, UserId } from '@shared/domain/types';
import { Notification } from '../entities/notification.entity';

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');

export interface NotificationRepository {
  findById(
    id: NotificationId,
    tenantId: TenantId,
  ): Promise<Notification | null>;
  save(notification: Notification, outboxEvents?: DomainEvent[]): Promise<void>;
  markAllAsRead(tenantId: TenantId, userId: UserId): Promise<number>;
}
