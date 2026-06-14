import { DomainEvent } from '@shared/domain/domain-event.base';

export class ActivityCreatedEvent extends DomainEvent {
  readonly eventName = 'activity.created';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly type: string,
    readonly subject: string,
    readonly relatedToType: string,
    readonly relatedToId: string,
    readonly dueAt?: Date,
  ) {
    super(aggregateId, tenantId);
  }
}

export class ActivityCompletedEvent extends DomainEvent {
  readonly eventName = 'activity.completed';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly completedAt: Date,
  ) {
    super(aggregateId, tenantId);
  }
}

export class ActivityRescheduledEvent extends DomainEvent {
  readonly eventName = 'activity.rescheduled';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly dueAt: Date,
  ) {
    super(aggregateId, tenantId);
  }
}

export class ActivityDeletedEvent extends DomainEvent {
  readonly eventName = 'activity.deleted';

  constructor(aggregateId: string, tenantId: string) {
    super(aggregateId, tenantId);
  }
}
