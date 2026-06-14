import { Inject, Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { TenantId, UserId } from '@shared/domain/types';
import {
  Notification,
  NotificationType,
} from '../domain/entities/notification.entity';
import {
  NOTIFICATION_REPOSITORY,
  NotificationRepository,
} from '../domain/repositories/notification.repository';

export interface CreateNotificationInput {
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
}

@Injectable()
export class NotificationService {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repository: NotificationRepository,
    private readonly eventBus: EventBus,
  ) {}

  async create(input: CreateNotificationInput): Promise<{ id: string }> {
    const notification = Notification.create({
      tenantId: TenantId(input.tenantId),
      userId: UserId(input.userId),
      type: input.type,
      title: input.title,
      body: input.body,
    });

    const events = notification.pullDomainEvents();
    await this.repository.save(notification, events);
    this.eventBus.publishAll(events);

    return { id: notification.id };
  }
}
