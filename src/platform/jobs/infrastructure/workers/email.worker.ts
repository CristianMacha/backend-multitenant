import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES, SendEmailJobData } from '../../domain/queues';

@Processor(QUEUES.EMAILS)
export class EmailWorker extends WorkerHost {
  private readonly logger = new Logger(EmailWorker.name);

  async process(job: Job<SendEmailJobData>): Promise<void> {
    this.logger.log(
      `Processing email job ${job.id}: "${job.data.subject}" -> ${job.data.to}`,
    );
    // Integrate the actual email provider (SES, SendGrid, Resend, ...) here.
    await Promise.resolve();
  }
}
