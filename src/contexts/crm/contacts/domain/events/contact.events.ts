import { DomainEvent } from '@shared/domain/domain-event.base';

export class ContactCreatedEvent extends DomainEvent {
  readonly eventName = 'contact.created';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly ownerId: string,
  ) {
    super(aggregateId, tenantId);
  }
}

export class ContactUpdatedEvent extends DomainEvent {
  readonly eventName = 'contact.updated';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly changes: Record<string, unknown>,
  ) {
    super(aggregateId, tenantId);
  }
}

export class ContactDeletedEvent extends DomainEvent {
  readonly eventName = 'contact.deleted';

  constructor(aggregateId: string, tenantId: string) {
    super(aggregateId, tenantId);
  }
}

export class ContactLinkedToAccountEvent extends DomainEvent {
  readonly eventName = 'contact.linked-to-account';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly accountId: string | null,
  ) {
    super(aggregateId, tenantId);
  }
}
