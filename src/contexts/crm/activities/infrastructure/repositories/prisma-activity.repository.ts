import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DomainEvent } from '@shared/domain/domain-event.base';
import { ActivityId, TenantId } from '@shared/domain/types';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { writeToOutbox } from '@shared/infrastructure/prisma/outbox.helper';
import { Activity, RelatedToType } from '../../domain/entities/activity.entity';
import {
  ActivityRepository,
  FindActivitiesOptions,
} from '../../domain/repositories/activity.repository';
import { ActivityMapper } from '../mappers/activity.mapper';

@Injectable()
export class PrismaActivityRepository implements ActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: ActivityId, tenantId: TenantId): Promise<Activity | null> {
    const raw = await this.prisma.activity.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    return raw ? ActivityMapper.toDomain(raw) : null;
  }

  async findMany(
    options: FindActivitiesOptions,
  ): Promise<{ items: Activity[]; total: number }> {
    const where: Prisma.ActivityWhereInput = {
      tenantId: options.tenantId,
      deletedAt: null,
      ...(options.relatedToType
        ? { relatedToType: options.relatedToType }
        : {}),
      ...(options.relatedToId ? { relatedToId: options.relatedToId } : {}),
      ...(options.ownerId ? { ownerId: options.ownerId } : {}),
      ...(options.status ? { status: options.status } : {}),
      ...(options.dueDateFrom || options.dueDateTo
        ? {
            dueAt: {
              ...(options.dueDateFrom ? { gte: options.dueDateFrom } : {}),
              ...(options.dueDateTo ? { lte: options.dueDateTo } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.activity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.activity.count({ where }),
    ]);

    return { items: items.map((r) => ActivityMapper.toDomain(r)), total };
  }

  async findTimeline(
    relatedToType: RelatedToType,
    relatedToId: string,
    tenantId: TenantId,
  ): Promise<Activity[]> {
    const items = await this.prisma.activity.findMany({
      where: { tenantId, relatedToType, relatedToId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return items.map((r) => ActivityMapper.toDomain(r));
  }

  async save(
    activity: Activity,
    outboxEvents: DomainEvent[] = [],
  ): Promise<void> {
    const data = ActivityMapper.toPersistence(activity);

    await this.prisma.$transaction(async (tx) => {
      await tx.activity.upsert({
        where: { id: activity.id },
        create: data,
        update: data,
      });
      await writeToOutbox(tx, outboxEvents);
    });
  }
}
