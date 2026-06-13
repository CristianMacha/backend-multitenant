import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { OpportunityStatus, Prisma } from '@prisma/client';
import { PaginatedResultDto } from '@shared/presentation/dto/pagination.dto';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  OpportunityReadModel,
  toOpportunityReadModel,
} from '../opportunity.read-model';
import { GetOpportunitiesQuery } from './get-opportunities.query';

@QueryHandler(GetOpportunitiesQuery)
export class GetOpportunitiesHandler implements IQueryHandler<GetOpportunitiesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    query: GetOpportunitiesQuery,
  ): Promise<PaginatedResultDto<OpportunityReadModel>> {
    const where: Prisma.OpportunityWhereInput = {
      tenantId: query.tenantId,
      deletedAt: null,
      ...(query.pipelineId ? { pipelineId: query.pipelineId } : {}),
      ...(query.stageId ? { stageId: query.stageId } : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      ...(query.status ? { status: query.status as OpportunityStatus } : {}),
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };

    const [opportunities, total] = await this.prisma.$transaction([
      this.prisma.opportunity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.opportunity.count({ where }),
    ]);

    return PaginatedResultDto.of(
      opportunities.map(toOpportunityReadModel),
      total,
      query.page,
      query.limit,
    );
  }
}
