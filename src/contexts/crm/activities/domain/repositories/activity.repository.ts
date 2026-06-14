import { DomainEvent } from '@shared/domain/domain-event.base';
import { ActivityId, TenantId } from '@shared/domain/types';
import {
  Activity,
  ActivityStatus,
  RelatedToType,
} from '../entities/activity.entity';

export const ACTIVITY_REPOSITORY = Symbol('ACTIVITY_REPOSITORY');

export interface FindActivitiesOptions {
  tenantId: TenantId;
  page: number;
  limit: number;
  relatedToType?: RelatedToType;
  relatedToId?: string;
  ownerId?: string;
  status?: ActivityStatus;
  dueDateFrom?: Date;
  dueDateTo?: Date;
}

export interface ActivityRepository {
  findById(id: ActivityId, tenantId: TenantId): Promise<Activity | null>;
  findMany(
    options: FindActivitiesOptions,
  ): Promise<{ items: Activity[]; total: number }>;
  findTimeline(
    relatedToType: RelatedToType,
    relatedToId: string,
    tenantId: TenantId,
  ): Promise<Activity[]>;
  save(activity: Activity, outboxEvents?: DomainEvent[]): Promise<void>;
}
