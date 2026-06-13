import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { PipelineReadModel, toPipelineReadModel } from '../pipeline.read-model';
import { GetPipelineByIdQuery } from './get-pipeline-by-id.query';

@QueryHandler(GetPipelineByIdQuery)
export class GetPipelineByIdHandler implements IQueryHandler<GetPipelineByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetPipelineByIdQuery): Promise<PipelineReadModel> {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: query.id, tenantId: query.tenantId, deletedAt: null },
      include: { stages: true },
    });
    if (!pipeline) throw new EntityNotFoundException('Pipeline', query.id);
    return toPipelineReadModel(pipeline);
  }
}
