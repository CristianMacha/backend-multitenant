import { Injectable } from '@nestjs/common';
import { DomainEvent } from '@shared/domain/domain-event.base';
import { PipelineId, TenantId } from '@shared/domain/types';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { writeToOutbox } from '@shared/infrastructure/prisma/outbox.helper';
import { Pipeline } from '../../domain/entities/pipeline.entity';
import { PipelineRepository } from '../../domain/repositories/pipeline.repository';
import { PipelineMapper } from '../mappers/pipeline.mapper';

@Injectable()
export class PrismaPipelineRepository implements PipelineRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: PipelineId, tenantId: TenantId): Promise<Pipeline | null> {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { stages: true },
    });
    return pipeline ? PipelineMapper.toDomain(pipeline) : null;
  }

  async findAll(tenantId: TenantId): Promise<Pipeline[]> {
    const pipelines = await this.prisma.pipeline.findMany({
      where: { tenantId, deletedAt: null },
      include: { stages: true },
      orderBy: { createdAt: 'asc' },
    });
    return pipelines.map((p) => PipelineMapper.toDomain(p));
  }

  async save(
    pipeline: Pipeline,
    outboxEvents: DomainEvent[] = [],
  ): Promise<void> {
    const stages = [...pipeline.stages];

    await this.prisma.$transaction(async (tx) => {
      // A tenant has at most one default pipeline: clear the flag elsewhere.
      if (pipeline.isDefault) {
        await tx.pipeline.updateMany({
          where: {
            tenantId: pipeline.tenantId,
            id: { not: pipeline.id },
            isDefault: true,
          },
          data: { isDefault: false },
        });
      }

      await tx.pipeline.upsert({
        where: { id: pipeline.id },
        create: {
          id: pipeline.id,
          tenantId: pipeline.tenantId,
          name: pipeline.name,
          isDefault: pipeline.isDefault,
          deletedAt: pipeline.deletedAt,
        },
        update: {
          name: pipeline.name,
          isDefault: pipeline.isDefault,
          deletedAt: pipeline.deletedAt,
        },
      });

      // Sync stages (aggregate-internal): upsert current, drop removed.
      const keepIds = stages.map((s) => s.id);
      await tx.stage.deleteMany({
        where: { pipelineId: pipeline.id, id: { notIn: keepIds } },
      });
      for (const stage of stages) {
        await tx.stage.upsert({
          where: { id: stage.id },
          create: {
            id: stage.id,
            tenantId: pipeline.tenantId,
            pipelineId: pipeline.id,
            name: stage.name,
            order: stage.order,
            probability: stage.probability,
            type: stage.type,
          },
          update: {
            name: stage.name,
            order: stage.order,
            probability: stage.probability,
            type: stage.type,
          },
        });
      }

      await writeToOutbox(tx, outboxEvents);
    });
  }
}
