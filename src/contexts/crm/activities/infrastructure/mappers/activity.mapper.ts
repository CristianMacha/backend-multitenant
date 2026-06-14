import { Prisma, Activity as PrismaActivity } from '@prisma/client';
import { TenantId, UserId } from '@shared/domain/types';
import { Activity } from '../../domain/entities/activity.entity';

export class ActivityMapper {
  static toDomain(raw: PrismaActivity): Activity {
    return Activity.fromPersistence({
      id: raw.id,
      tenantId: TenantId(raw.tenantId),
      type: raw.type,
      subject: raw.subject,
      body: raw.body ?? undefined,
      dueAt: raw.dueAt ?? undefined,
      completedAt: raw.completedAt ?? undefined,
      status: raw.status,
      ownerId: raw.ownerId ? UserId(raw.ownerId) : undefined,
      source: raw.source,
      relatedToType: raw.relatedToType,
      relatedToId: raw.relatedToId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt,
    });
  }

  static toPersistence(
    activity: Activity,
  ): Prisma.ActivityUncheckedCreateInput {
    return {
      id: activity.id,
      tenantId: activity.tenantId,
      type: activity.type,
      subject: activity.subject,
      body: activity.body ?? null,
      dueAt: activity.dueAt ?? null,
      completedAt: activity.completedAt ?? null,
      status: activity.status,
      ownerId: activity.ownerId ?? null,
      source: activity.source,
      relatedToType: activity.relatedToType,
      relatedToId: activity.relatedToId,
      deletedAt: activity.deletedAt,
    };
  }
}
