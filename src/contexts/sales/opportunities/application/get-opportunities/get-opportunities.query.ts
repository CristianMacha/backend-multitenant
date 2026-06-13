import { Query } from '@nestjs/cqrs';
import { PaginatedResultDto } from '@shared/presentation/dto/pagination.dto';
import { OpportunityReadModel } from '../opportunity.read-model';

export class GetOpportunitiesQuery extends Query<
  PaginatedResultDto<OpportunityReadModel>
> {
  constructor(
    readonly tenantId: string,
    readonly page: number,
    readonly limit: number,
    readonly search?: string,
    readonly pipelineId?: string,
    readonly stageId?: string,
    readonly ownerId?: string,
    readonly status?: string,
  ) {
    super();
  }
}
