export interface TaskTodayReadModel {
  id: string;
  subject: string;
  type: string;
  dueAt: Date;
  relatedToType: string;
  relatedToId: string;
}

export interface OpportunityValueByCurrency {
  currency: string;
  count: number;
  totalAmount: number;
}

export interface FunnelStageReadModel {
  stageId: string;
  stageName: string;
  order: number;
  stageType: string;
  count: number;
  totalAmountByCurrency: { currency: string; total: number }[];
}

export interface DashboardSummaryReadModel {
  tasksToday: {
    count: number;
    items: TaskTodayReadModel[];
  };
  openOpportunityValue: OpportunityValueByCurrency[];
  closedWonThisMonth: OpportunityValueByCurrency[];
  funnelSnapshot: FunnelStageReadModel[];
}
