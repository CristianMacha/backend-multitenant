import { Query } from '@nestjs/cqrs';
import { OpportunityReadModel } from '../opportunity.read-model';

export class GetOpportunityByIdQuery extends Query<OpportunityReadModel> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
  ) {
    super();
  }
}
