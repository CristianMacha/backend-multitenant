import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { OutboxPublisherProcessor } from './outbox-publisher.processor';
import { OutboxScheduler } from './outbox.scheduler';
import { AuditLogService } from './audit-log.service';
import { OUTBOX_QUEUE } from './outbox.constants';

@Module({
  imports: [BullModule.registerQueue({ name: OUTBOX_QUEUE })],
  providers: [OutboxPublisherProcessor, OutboxScheduler, AuditLogService],
})
export class OutboxModule {}
