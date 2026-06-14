import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GetDashboardSummaryHandler } from './application/get-dashboard-summary/get-dashboard-summary.handler';
import { DashboardController } from './presentation/controllers/dashboard.controller';

@Module({
  imports: [CqrsModule],
  controllers: [DashboardController],
  providers: [GetDashboardSummaryHandler],
})
export class DashboardModule {}
