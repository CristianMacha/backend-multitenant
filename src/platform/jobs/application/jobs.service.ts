import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  GenerateReportJobData,
  JOB_NAMES,
  QUEUES,
  SendEmailJobData,
  SendNotificationJobData,
  SyncIntegrationJobData,
} from '../domain/queues';

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: { age: 86400, count: 1000 },
  removeOnFail: { age: 7 * 86400 },
};

/** Single entry point (producer) for enqueueing background jobs. */
@Injectable()
export class JobsService {
  constructor(
    @InjectQueue(QUEUES.EMAILS) private readonly emailsQueue: Queue,
    @InjectQueue(QUEUES.NOTIFICATIONS)
    private readonly notificationsQueue: Queue,
    @InjectQueue(QUEUES.REPORTS) private readonly reportsQueue: Queue,
    @InjectQueue(QUEUES.INTEGRATIONS) private readonly integrationsQueue: Queue,
  ) {}

  async enqueueEmail(data: SendEmailJobData): Promise<void> {
    await this.emailsQueue.add(JOB_NAMES.SEND_EMAIL, data, DEFAULT_JOB_OPTIONS);
  }

  async enqueueNotification(data: SendNotificationJobData): Promise<void> {
    await this.notificationsQueue.add(
      JOB_NAMES.SEND_NOTIFICATION,
      data,
      DEFAULT_JOB_OPTIONS,
    );
  }

  async enqueueReport(data: GenerateReportJobData): Promise<void> {
    await this.reportsQueue.add(
      JOB_NAMES.GENERATE_REPORT,
      data,
      DEFAULT_JOB_OPTIONS,
    );
  }

  async enqueueIntegrationSync(data: SyncIntegrationJobData): Promise<void> {
    await this.integrationsQueue.add(
      JOB_NAMES.SYNC_INTEGRATION,
      data,
      DEFAULT_JOB_OPTIONS,
    );
  }
}
