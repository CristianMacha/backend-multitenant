import { DomainEvent } from '@shared/domain/domain-event.base';

export class AccountCreatedEvent extends DomainEvent {
  readonly eventName = 'account.created';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly name: string,
    readonly ownerId: string,
  ) {
    super(aggregateId, tenantId);
  }
}

export class AccountUpdatedEvent extends DomainEvent {
  readonly eventName = 'account.updated';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly changes: Record<string, unknown>,
  ) {
    super(aggregateId, tenantId);
  }
}

export class AccountArchivedEvent extends DomainEvent {
  readonly eventName = 'account.archived';

  constructor(aggregateId: string, tenantId: string) {
    super(aggregateId, tenantId);
  }
}

export class AccountOwnerChangedEvent extends DomainEvent {
  readonly eventName = 'account.owner-changed';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly ownerId: string,
  ) {
    super(aggregateId, tenantId);
  }
}
