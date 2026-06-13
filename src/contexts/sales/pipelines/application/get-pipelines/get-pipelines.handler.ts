import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { PipelineReadModel, toPipelineReadModel } from '../pipeline.read-model';
import { GetPipelinesQuery } from './get-pipelines.query';

@QueryHandler(GetPipelinesQuery)
export class GetPipelinesHandler implements IQueryHandler<GetPipelinesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetPipelinesQuery): Promise<PipelineReadModel[]> {
    const pipelines = await this.prisma.pipeline.findMany({
      where: { tenantId: query.tenantId, deletedAt: null },
      include: { stages: true },
      orderBy: { createdAt: 'asc' },
    });
    return pipelines.map(toPipelineReadModel);
  }
}
