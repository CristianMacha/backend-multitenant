import { DomainEvent } from '@shared/domain/domain-event.base';

export class NotificationCreatedEvent extends DomainEvent {
  readonly eventName = 'notification.created';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly userId: string,
    readonly type: string,
    readonly title: string,
  ) {
    super(aggregateId, tenantId);
  }
}

export class NotificationDeletedEvent extends DomainEvent {
  readonly eventName = 'notification.deleted';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly userId: string,
  ) {
    super(aggregateId, tenantId);
  }
}
