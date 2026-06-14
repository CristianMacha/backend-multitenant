import { Module } from '@nestjs/common';
import { CacheModule } from './cache/cache.module';
import { JobsModule } from './jobs/jobs.module';
import { HealthModule } from './health/health.module';
import { OutboxModule } from './outbox/outbox.module';
import { NotificationsModule } from './notifications/notifications.module';

/**
 * Technical platform services (not bounded contexts): Redis cache,
 * BullMQ queues/workers and health checks. Business contexts depend
 * on these, never the other way around.
 */
@Module({
  imports: [
    CacheModule,
    JobsModule,
    HealthModule,
    OutboxModule,
    NotificationsModule,
  ],
  exports: [CacheModule, JobsModule, NotificationsModule],
})
export class PlatformModule {}
