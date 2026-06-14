import { Injectable } from '@nestjs/common';
import { DomainEvent } from '@shared/domain/domain-event.base';
import { NotificationId, TenantId, UserId } from '@shared/domain/types';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { writeToOutbox } from '@shared/infrastructure/prisma/outbox.helper';
import { Notification } from '../../domain/entities/notification.entity';
import { NotificationRepository } from '../../domain/repositories/notification.repository';
import { NotificationMapper } from '../mappers/notification.mapper';

@Injectable()
export class PrismaNotificationRepository implements NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    id: NotificationId,
    tenantId: TenantId,
  ): Promise<Notification | null> {
    const raw = await this.prisma.notification.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return raw ? NotificationMapper.toDomain(raw) : null;
  }

  async save(
    notification: Notification,
    outboxEvents: DomainEvent[] = [],
  ): Promise<void> {
    const data = NotificationMapper.toPersistence(notification);

    await this.prisma.$transaction(async (tx) => {
      await tx.notification.upsert({
        where: { id: notification.id },
        create: data,
        update: data,
      });
      await writeToOutbox(tx, outboxEvents);
    });
  }

  async markAllAsRead(tenantId: TenantId, userId: UserId): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: {
        tenantId,
        userId,
        read: false,
        deletedAt: null,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
    return result.count;
  }
}
