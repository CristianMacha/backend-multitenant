import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotificationId, TenantId } from '@shared/domain/types';
import { EntityNotFoundException } from '@shared/exceptions';
import {
  NOTIFICATION_REPOSITORY,
  NotificationRepository,
} from '../../domain/repositories/notification.repository';
import { MarkNotificationReadCommand } from './mark-notification-read.command';

@CommandHandler(MarkNotificationReadCommand)
export class MarkNotificationReadHandler implements ICommandHandler<MarkNotificationReadCommand> {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repository: NotificationRepository,
  ) {}

  async execute(command: MarkNotificationReadCommand): Promise<void> {
    const notification = await this.repository.findById(
      NotificationId(command.notificationId),
      TenantId(command.tenantId),
    );

    if (!notification) {
      throw new EntityNotFoundException('Notification', command.notificationId);
    }

    // R17: if notification belongs to a different user, treat as not found (404)
    if (notification.userId !== command.userId) {
      throw new EntityNotFoundException('Notification', command.notificationId);
    }

    notification.markAsRead(); // idempotent — R18
    await this.repository.save(notification); // no outbox events for read
  }
}
