import { DomainEvent } from '@shared/domain/domain-event.base';

export class UserCreatedEvent extends DomainEvent {
  readonly eventName = 'user.created';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly email: string,
  ) {
    super(aggregateId, tenantId);
  }
}

export class UserUpdatedEvent extends DomainEvent {
  readonly eventName = 'user.updated';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly changes: Record<string, unknown>,
  ) {
    super(aggregateId, tenantId);
  }
}

export class UserDeletedEvent extends DomainEvent {
  readonly eventName = 'user.deleted';

  constructor(aggregateId: string, tenantId: string) {
    super(aggregateId, tenantId);
  }
}

export class RoleAssignedEvent extends DomainEvent {
  readonly eventName = 'user.role-assigned';

  constructor(
    aggregateId: string,
    tenantId: string,
    readonly roleId: string,
  ) {
    super(aggregateId, tenantId);
  }
}
