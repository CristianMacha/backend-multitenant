import { Notification as PrismaNotification } from '@prisma/client';

export interface NotificationReadModel {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toNotificationReadModel(
  raw: PrismaNotification,
): NotificationReadModel {
  return {
    id: raw.id,
    tenantId: raw.tenantId,
    userId: raw.userId,
    type: raw.type,
    title: raw.title,
    body: raw.body,
    read: raw.read,
    readAt: raw.readAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
