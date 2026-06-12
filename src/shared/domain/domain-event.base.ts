import { randomUUID } from 'crypto';

/**
 * Base class for all domain events. Carries metadata required for
 * traceability and future publication to external brokers
 * (Kafka, RabbitMQ, NATS) without changing event contracts.
 */
export abstract class DomainEvent {
  readonly eventId: string;
  readonly occurredAt: Date;
  abstract readonly eventName: string;

  readonly aggregateId: string;
  readonly tenantId: string | null;

  protected constructor(aggregateId: string, tenantId: string | null = null) {
    this.eventId = randomUUID();
    this.occurredAt = new Date();
    this.aggregateId = aggregateId;
    this.tenantId = tenantId;
  }
}
