import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { OUTBOX_PUBLISH_JOB, OUTBOX_QUEUE } from './outbox.constants';

/**
 * Registers the repeatable job that drains the outbox.
 * Runs every 10 seconds — tune via env if needed.
 */
@Injectable()
export class OutboxScheduler implements OnModuleInit {
  constructor(@InjectQueue(OUTBOX_QUEUE) private readonly queue: Queue) {}

  async onModuleInit(): Promise<void> {
    await this.queue.add(
      OUTBOX_PUBLISH_JOB,
      {},
      { repeat: { every: 10_000 }, jobId: OUTBOX_PUBLISH_JOB },
    );
  }
}
