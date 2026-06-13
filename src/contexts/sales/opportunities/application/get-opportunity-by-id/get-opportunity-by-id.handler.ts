import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  OpportunityReadModel,
  toOpportunityReadModel,
} from '../opportunity.read-model';
import { GetOpportunityByIdQuery } from './get-opportunity-by-id.query';

@QueryHandler(GetOpportunityByIdQuery)
export class GetOpportunityByIdHandler implements IQueryHandler<GetOpportunityByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetOpportunityByIdQuery): Promise<OpportunityReadModel> {
    const opportunity = await this.prisma.opportunity.findFirst({
      where: { id: query.id, tenantId: query.tenantId, deletedAt: null },
    });
    if (!opportunity) {
      throw new EntityNotFoundException('Opportunity', query.id);
    }
    return toOpportunityReadModel(opportunity);
  }
}
