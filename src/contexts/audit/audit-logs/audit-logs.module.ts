import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '@contexts/iam/auth/auth.module';
import { AuditLogsController } from './presentation/controllers/audit-logs.controller';

@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [AuditLogsController],
})
export class AuditLogsModule {}
