import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES, SendNotificationJobData } from '../../domain/queues';

@Processor(QUEUES.NOTIFICATIONS)
export class NotificationWorker extends WorkerHost {
  private readonly logger = new Logger(NotificationWorker.name);

  async process(job: Job<SendNotificationJobData>): Promise<void> {
    this.logger.log(
      `Processing notification job ${job.id} for user ${job.data.userId}`,
    );
    // Integrate push/in-app notification delivery here.
    await Promise.resolve();
  }
}
