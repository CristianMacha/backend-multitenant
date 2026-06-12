import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '@contexts/iam/auth/auth.module';
import { AuditLogService } from './application/audit-log.service';
import { DomainEventsAuditHandler } from './application/event-handlers/domain-events-audit.handler';
import { AuditLogsController } from './presentation/controllers/audit-logs.controller';

@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [AuditLogsController],
  providers: [AuditLogService, DomainEventsAuditHandler],
  exports: [AuditLogService],
})
export class AuditLogsModule {}
