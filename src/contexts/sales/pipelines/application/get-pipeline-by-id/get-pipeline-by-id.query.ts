import { Query } from '@nestjs/cqrs';
import { PipelineReadModel } from '../pipeline.read-model';

export class GetPipelineByIdQuery extends Query<PipelineReadModel> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
  ) {
    super();
  }
}
