import { Module } from '@nestjs/common';
import { AuditLogsModule } from './audit-logs/audit-logs.module';

/**
 * Audit bounded context.
 * Subscribes to domain events from other contexts and keeps the
 * immutable audit trail.
 */
@Module({
  imports: [AuditLogsModule],
  exports: [AuditLogsModule],
})
export class AuditContextModule {}
