import { Prisma, Notification as PrismaNotification } from '@prisma/client';
import { TenantId, UserId } from '@shared/domain/types';
import { Notification } from '../../domain/entities/notification.entity';

export class NotificationMapper {
  static toDomain(raw: PrismaNotification): Notification {
    return Notification.fromPersistence({
      id: raw.id,
      tenantId: TenantId(raw.tenantId),
      userId: UserId(raw.userId),
      type: raw.type,
      title: raw.title,
      body: raw.body,
      read: raw.read,
      readAt: raw.readAt ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(
    notification: Notification,
  ): Prisma.NotificationUncheckedCreateInput {
    return {
      id: notification.id,
      tenantId: notification.tenantId,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      read: notification.read,
      readAt: notification.readAt ?? null,
      deletedAt: notification.deletedAt,
    };
  }
}
