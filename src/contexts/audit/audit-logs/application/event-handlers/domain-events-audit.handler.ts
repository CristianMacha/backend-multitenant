import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import {
  RoleAssignedEvent,
  UserCreatedEvent,
  UserDeletedEvent,
  UserUpdatedEvent,
} from '@contexts/iam/users/domain/events/user.events';
import {
  RoleCreatedEvent,
  RoleDeletedEvent,
  RoleUpdatedEvent,
} from '@contexts/iam/roles/domain/events/role.events';
import { DomainEvent } from '@shared/domain/domain-event.base';
import { AuditLogService } from '../audit-log.service';

type AuditableEvent = DomainEvent & { changes?: Record<string, unknown> };

/**
 * Cross-cutting audit trail: every domain event published on the
 * event bus is persisted as an audit log entry.
 */
@EventsHandler(
  UserCreatedEvent,
  UserUpdatedEvent,
  UserDeletedEvent,
  RoleAssignedEvent,
  RoleCreatedEvent,
  RoleUpdatedEvent,
  RoleDeletedEvent,
)
export class DomainEventsAuditHandler implements IEventHandler<AuditableEvent> {
  constructor(private readonly auditLogService: AuditLogService) {}

  async handle(event: AuditableEvent): Promise<void> {
    const [entity, action] = event.eventName.split('.');
    await this.auditLogService.record({
      action,
      entity,
      entityId: event.aggregateId,
      newValues: event.changes,
      tenantId: event.tenantId ?? undefined,
    });
  }
}
