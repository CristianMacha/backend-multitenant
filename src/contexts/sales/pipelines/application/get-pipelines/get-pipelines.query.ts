import { Query } from '@nestjs/cqrs';
import { PipelineReadModel } from '../pipeline.read-model';

export class GetPipelinesQuery extends Query<PipelineReadModel[]> {
  constructor(readonly tenantId: string) {
    super();
  }
}
