import { AggregateRoot } from '@shared/domain/aggregate-root.base';
import { BaseEntityProps } from '@shared/domain/entity.base';
import { TenantId, UserId } from '@shared/domain/types';
import { DomainException } from '@shared/exceptions';
import {
  ActivityCompletedEvent,
  ActivityCreatedEvent,
  ActivityDeletedEvent,
  ActivityRescheduledEvent,
} from '../events/activity.events';

export type ActivityType =
  | 'CALL'
  | 'MEETING'
  | 'EMAIL'
  | 'TASK'
  | 'NOTE'
  | 'SYSTEM';
export type ActivityStatus = 'OPEN' | 'DONE';
export type ActivitySource = 'USER' | 'SYSTEM';
export type RelatedToType = 'ACCOUNT' | 'CONTACT' | 'OPPORTUNITY';

export interface ActivityProps extends BaseEntityProps {
  tenantId: TenantId;
  type: ActivityType;
  subject: string;
  body?: string;
  dueAt?: Date;
  completedAt?: Date;
  status: ActivityStatus;
  ownerId?: UserId;
  source: ActivitySource;
  relatedToType: RelatedToType;
  relatedToId: string;
}

export interface CreateActivityProps {
  tenantId: TenantId;
  type: ActivityType;
  subject: string;
  body?: string;
  dueAt?: Date;
  ownerId?: UserId;
  source?: ActivitySource;
  relatedToType: RelatedToType;
  relatedToId: string;
}

export class Activity extends AggregateRoot<ActivityProps> {
  private constructor(props: ActivityProps) {
    super(props);
  }

  static create(props: CreateActivityProps): Activity {
    const subject = props.subject.trim();
    if (!subject) {
      throw new DomainException(
        'Activity subject is required',
        'INVALID_ACTIVITY',
      );
    }

    const activity = new Activity({
      tenantId: props.tenantId,
      type: props.type,
      subject,
      body: props.body?.trim() || undefined,
      dueAt: props.dueAt,
      completedAt: undefined,
      status: 'OPEN',
      ownerId: props.ownerId,
      source: props.source ?? 'USER',
      relatedToType: props.relatedToType,
      relatedToId: props.relatedToId,
    });

    activity.addDomainEvent(
      new ActivityCreatedEvent(
        activity.id,
        activity.tenantId,
        activity.type,
        activity.subject,
        activity.relatedToType,
        activity.relatedToId,
        activity.dueAt,
      ),
    );

    return activity;
  }

  static fromPersistence(props: ActivityProps): Activity {
    return new Activity(props);
  }

  get tenantId(): TenantId {
    return this.props.tenantId;
  }
  get type(): ActivityType {
    return this.props.type;
  }
  get subject(): string {
    return this.props.subject;
  }
  get body(): string | undefined {
    return this.props.body;
  }
  get dueAt(): Date | undefined {
    return this.props.dueAt;
  }
  get completedAt(): Date | undefined {
    return this.props.completedAt;
  }
  get status(): ActivityStatus {
    return this.props.status;
  }
  get ownerId(): UserId | undefined {
    return this.props.ownerId;
  }
  get source(): ActivitySource {
    return this.props.source;
  }
  get relatedToType(): RelatedToType {
    return this.props.relatedToType;
  }
  get relatedToId(): string {
    return this.props.relatedToId;
  }
  get isDone(): boolean {
    return this.props.status === 'DONE';
  }

  complete(): void {
    if (this.isDone) {
      throw new DomainException(
        'Activity is already completed',
        'ACTIVITY_ALREADY_DONE',
      );
    }
    this.props.status = 'DONE';
    this.props.completedAt = new Date();
    this.touch();
    this.addDomainEvent(
      new ActivityCompletedEvent(
        this.id,
        this.tenantId,
        this.props.completedAt,
      ),
    );
  }

  reschedule(dueAt: Date): void {
    if (this.isDone) {
      throw new DomainException(
        'Cannot reschedule a completed activity',
        'ACTIVITY_ALREADY_DONE',
      );
    }
    this.props.dueAt = dueAt;
    this.touch();
    this.addDomainEvent(
      new ActivityRescheduledEvent(this.id, this.tenantId, dueAt),
    );
  }

  delete(): void {
    this.softDelete();
    this.addDomainEvent(new ActivityDeletedEvent(this.id, this.tenantId));
  }
}
