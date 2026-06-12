import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { GenerateReportJobData, QUEUES } from '../../domain/queues';

@Processor(QUEUES.REPORTS)
export class ReportWorker extends WorkerHost {
  private readonly logger = new Logger(ReportWorker.name);

  async process(job: Job<GenerateReportJobData>): Promise<void> {
    this.logger.log(`Processing report job ${job.id}: ${job.data.reportType}`);
    // Implement report generation (PDF/Excel/CSV) here.
    await Promise.resolve();
  }
}
