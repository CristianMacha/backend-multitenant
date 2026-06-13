import { OpportunityReadModel } from '../opportunity.read-model';

export interface BoardColumn {
  stageId: string;
  name: string;
  order: number;
  probability: number;
  type: string;
  opportunityCount: number;
  totalAmount: number;
  opportunities: OpportunityReadModel[];
}

export interface PipelineBoardReadModel {
  pipelineId: string;
  name: string;
  columns: BoardColumn[];
}
