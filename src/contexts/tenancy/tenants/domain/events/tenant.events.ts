import { DomainEvent } from '@shared/domain/domain-event.base';

export class TenantCreatedEvent extends DomainEvent {
  readonly eventName = 'tenant.created';

  constructor(
    aggregateId: string,
    readonly name: string,
    readonly slug: string,
  ) {
    super(aggregateId, aggregateId);
  }
}

export class TenantUpdatedEvent extends DomainEvent {
  readonly eventName = 'tenant.updated';

  constructor(
    aggregateId: string,
    readonly changes: Record<string, unknown>,
  ) {
    super(aggregateId, aggregateId);
  }
}

export class TenantDeletedEvent extends DomainEvent {
  readonly eventName = 'tenant.deleted';

  constructor(aggregateId: string) {
    super(aggregateId, aggregateId);
  }
}
