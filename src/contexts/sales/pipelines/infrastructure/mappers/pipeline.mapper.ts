import {
  Pipeline as PrismaPipeline,
  Stage as PrismaStage,
} from '@prisma/client';
import { StageId, TenantId } from '@shared/domain/types';
import { Pipeline } from '../../domain/entities/pipeline.entity';

type PrismaPipelineWithStages = PrismaPipeline & { stages: PrismaStage[] };

export class PipelineMapper {
  static toDomain(raw: PrismaPipelineWithStages): Pipeline {
    return Pipeline.fromPersistence({
      id: raw.id,
      tenantId: TenantId(raw.tenantId),
      name: raw.name,
      isDefault: raw.isDefault,
      stages: raw.stages.map((s) => ({
        id: StageId(s.id),
        name: s.name,
        order: s.order,
        probability: s.probability,
        type: s.type,
      })),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }
}
