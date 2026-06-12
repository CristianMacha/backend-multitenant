import { DomainEvent } from '@shared/domain/domain-event.base';

export class RoleCreatedEvent extends DomainEvent {
  readonly eventName = 'role.created';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly name: string,
  ) {
    super(aggregateId, tenantId);
  }
}

export class RoleUpdatedEvent extends DomainEvent {
  readonly eventName = 'role.updated';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly changes: Record<string, unknown>,
  ) {
    super(aggregateId, tenantId);
  }
}

export class RoleDeletedEvent extends DomainEvent {
  readonly eventName = 'role.deleted';

  constructor(aggregateId: string, tenantId: string) {
    super(aggregateId, tenantId);
  }
}
