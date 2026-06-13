import {
  Pipeline as PrismaPipeline,
  Stage as PrismaStage,
} from '@prisma/client';

export interface StageReadModel {
  id: string;
  name: string;
  order: number;
  probability: number;
  type: string;
}

export interface PipelineReadModel {
  id: string;
  tenantId: string;
  name: string;
  isDefault: boolean;
  stages: StageReadModel[];
  createdAt: Date;
  updatedAt: Date;
}

export function toPipelineReadModel(
  pipeline: PrismaPipeline & { stages: PrismaStage[] },
): PipelineReadModel {
  return {
    id: pipeline.id,
    tenantId: pipeline.tenantId,
    name: pipeline.name,
    isDefault: pipeline.isDefault,
    stages: [...pipeline.stages]
      .sort((a, b) => a.order - b.order)
      .map((s) => ({
        id: s.id,
        name: s.name,
        order: s.order,
        probability: s.probability,
        type: s.type,
      })),
    createdAt: pipeline.createdAt,
    updatedAt: pipeline.updatedAt,
  };
}
