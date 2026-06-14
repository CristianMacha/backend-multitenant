import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TenantId, UserId } from '@shared/domain/types';
import {
  NOTIFICATION_REPOSITORY,
  NotificationRepository,
} from '../../domain/repositories/notification.repository';
import { MarkAllNotificationsReadCommand } from './mark-all-notifications-read.command';

@CommandHandler(MarkAllNotificationsReadCommand)
export class MarkAllNotificationsReadHandler implements ICommandHandler<MarkAllNotificationsReadCommand> {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repository: NotificationRepository,
  ) {}

  async execute(
    command: MarkAllNotificationsReadCommand,
  ): Promise<{ updated: number }> {
    const updated = await this.repository.markAllAsRead(
      TenantId(command.tenantId),
      UserId(command.userId),
    );
    return { updated };
  }
}
