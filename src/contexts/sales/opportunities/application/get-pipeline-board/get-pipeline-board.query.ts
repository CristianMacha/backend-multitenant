import { Query } from '@nestjs/cqrs';
import { PipelineBoardReadModel } from './pipeline-board.read-model';

export class GetPipelineBoardQuery extends Query<PipelineBoardReadModel> {
  constructor(
    readonly pipelineId: string,
    readonly tenantId: string,
  ) {
    super();
  }
}
