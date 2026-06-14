import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BullModule } from '@nestjs/bullmq';
import { QUEUES } from '@platform/jobs/domain/queues';
import { NOTIFICATION_REPOSITORY } from './domain/repositories/notification.repository';
import { NotificationService } from './application/notification.service';
import { MarkNotificationReadHandler } from './application/mark-notification-read/mark-notification-read.handler';
import { MarkAllNotificationsReadHandler } from './application/mark-all-notifications-read/mark-all-notifications-read.handler';
import { GetNotificationsHandler } from './application/get-notifications/get-notifications.handler';
import { GetUnreadCountHandler } from './application/get-unread-count/get-unread-count.handler';
import { PrismaNotificationRepository } from './infrastructure/repositories/prisma-notification.repository';
import { ActivityReminderWorker } from './infrastructure/workers/activity-reminder.worker';
import { NotificationsController } from './presentation/controllers/notifications.controller';

@Module({
  imports: [
    CqrsModule,
    // Register as consumer of the activity-reminders queue.
    // JobsModule already registers it as producer — both registrations are valid with BullMQ.
    BullModule.registerQueue({ name: QUEUES.ACTIVITY_REMINDERS }),
  ],
  controllers: [NotificationsController],
  providers: [
    // Repository binding
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: PrismaNotificationRepository,
    },
    // Application services
    NotificationService,
    // Command handlers
    MarkNotificationReadHandler,
    MarkAllNotificationsReadHandler,
    // Query handlers
    GetNotificationsHandler,
    GetUnreadCountHandler,
    // Infrastructure
    ActivityReminderWorker,
  ],
  exports: [NotificationService],
})
export class NotificationsModule {}
