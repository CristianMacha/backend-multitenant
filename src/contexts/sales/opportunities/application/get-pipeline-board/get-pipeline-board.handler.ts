import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { toOpportunityReadModel } from '../opportunity.read-model';
import { GetPipelineBoardQuery } from './get-pipeline-board.query';
import {
  BoardColumn,
  PipelineBoardReadModel,
} from './pipeline-board.read-model';

@QueryHandler(GetPipelineBoardQuery)
export class GetPipelineBoardHandler implements IQueryHandler<GetPipelineBoardQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetPipelineBoardQuery): Promise<PipelineBoardReadModel> {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: {
        id: query.pipelineId,
        tenantId: query.tenantId,
        deletedAt: null,
      },
      include: { stages: true },
    });
    if (!pipeline) {
      throw new EntityNotFoundException('Pipeline', query.pipelineId);
    }

    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        pipelineId: query.pipelineId,
        tenantId: query.tenantId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    const byStage = new Map<
      string,
      ReturnType<typeof toOpportunityReadModel>[]
    >();
    for (const opportunity of opportunities) {
      const list = byStage.get(opportunity.stageId) ?? [];
      list.push(toOpportunityReadModel(opportunity));
      byStage.set(opportunity.stageId, list);
    }

    const columns: BoardColumn[] = [...pipeline.stages]
      .sort((a, b) => a.order - b.order)
      .map((stage) => {
        const items = byStage.get(stage.id) ?? [];
        return {
          stageId: stage.id,
          name: stage.name,
          order: stage.order,
          probability: stage.probability,
          type: stage.type,
          opportunityCount: items.length,
          totalAmount: items.reduce((sum, o) => sum + o.amount, 0),
          opportunities: items,
        };
      });

    return { pipelineId: pipeline.id, name: pipeline.name, columns };
  }
}
