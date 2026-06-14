import { ApiProperty } from '@nestjs/swagger';

export class TaskTodayDto {
  @ApiProperty() id: string;
  @ApiProperty() subject: string;
  @ApiProperty() type: string;
  @ApiProperty() dueAt: Date;
  @ApiProperty({ nullable: true }) relatedToType: string | null;
  @ApiProperty({ nullable: true }) relatedToId: string | null;
}

export class OpportunityValueByCurrencyDto {
  @ApiProperty() currency: string;
  @ApiProperty() count: number;
  @ApiProperty() totalAmount: number;
}

export class FunnelAmountByCurrencyDto {
  @ApiProperty() currency: string;
  @ApiProperty() total: number;
}

export class FunnelStageDto {
  @ApiProperty() stageId: string;
  @ApiProperty() stageName: string;
  @ApiProperty() order: number;
  @ApiProperty() stageType: string;
  @ApiProperty() count: number;
  @ApiProperty({ type: [FunnelAmountByCurrencyDto] })
  totalAmountByCurrency: FunnelAmountByCurrencyDto[];
}

export class TasksTodaySummaryDto {
  @ApiProperty() count: number;
  @ApiProperty({ type: [TaskTodayDto] }) items: TaskTodayDto[];
}

export class DashboardSummaryResponseDto {
  @ApiProperty({ type: TasksTodaySummaryDto }) tasksToday: TasksTodaySummaryDto;
  @ApiProperty({ type: [OpportunityValueByCurrencyDto] })
  openOpportunityValue: OpportunityValueByCurrencyDto[];
  @ApiProperty({ type: [OpportunityValueByCurrencyDto] })
  closedWonThisMonth: OpportunityValueByCurrencyDto[];
  @ApiProperty({ type: [FunnelStageDto] }) funnelSnapshot: FunnelStageDto[];
}
