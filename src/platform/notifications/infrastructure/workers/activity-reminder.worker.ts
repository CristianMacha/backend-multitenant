import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  ActivityReminderJobData,
  JOB_NAMES,
  QUEUES,
} from '@platform/jobs/domain/queues';
import { NotificationService } from '../../application/notification.service';

@Processor(QUEUES.ACTIVITY_REMINDERS)
export class ActivityReminderWorker extends WorkerHost {
  private readonly logger = new Logger(ActivityReminderWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  async process(job: Job<ActivityReminderJobData>): Promise<void> {
    if (job.name !== JOB_NAMES.ACTIVITY_REMINDER_DUE) {
      return; // Ignore unknown job names
    }

    const { activityId, tenantId } = job.data;

    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, tenantId, deletedAt: null },
      select: { id: true, ownerId: true, subject: true, dueAt: true },
    });

    if (!activity || !activity.ownerId) {
      // R11: activity not found, soft-deleted, or has no owner — skip silently
      this.logger.debug(
        `Activity ${activityId} not found or has no ownerId — skipping reminder`,
      );
      return;
    }

    await this.notificationService.create({
      tenantId,
      userId: activity.ownerId,
      type: 'ACTIVITY_REMINDER',
      title: 'Activity reminder',
      body: `Reminder: "${activity.subject}" is due.`,
    });

    this.logger.debug(
      `Notification created for activity ${activityId} — owner ${activity.ownerId}`,
    );
  }
}
