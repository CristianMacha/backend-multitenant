import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUES } from './domain/queues';
import { JobsService } from './application/jobs.service';
import { EmailWorker } from './infrastructure/workers/email.worker';
import { NotificationWorker } from './infrastructure/workers/notification.worker';
import { ReportWorker } from './infrastructure/workers/report.worker';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password'),
        },
        prefix: 'bull',
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUES.EMAILS },
      { name: QUEUES.NOTIFICATIONS },
      { name: QUEUES.REPORTS },
      { name: QUEUES.INTEGRATIONS },
    ),
  ],
  providers: [JobsService, EmailWorker, NotificationWorker, ReportWorker],
  exports: [JobsService],
})
export class JobsModule {}
