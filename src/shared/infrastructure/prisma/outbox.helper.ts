import { Prisma } from '@prisma/client';
import { DomainEvent } from '@shared/domain/domain-event.base';
import { RequestContextStorage } from '@shared/context/request-context';

type PrismaTx = Omit<
  Prisma.TransactionClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

/**
 * Persists domain events into the outbox table within the same transaction
 * as the aggregate save. Call this at the end of every repository `save()`
 * that receives events, before committing.
 *
 * The actor/request metadata (user, correlation id, IP, user agent) is read
 * from the request-scoped AsyncLocalStorage here — where it is still
 * populated — and stamped onto each row. The background outbox processor runs
 * outside the request, so it cannot recover this context later; capturing it
 * now is what keeps the audit trail attributable. For system-triggered
 * mutations (seeds, scripts, scheduled jobs) the context is absent and the
 * fields are legitimately null.
 */
export async function writeToOutbox(
  tx: PrismaTx,
  events: DomainEvent[],
): Promise<void> {
  if (events.length === 0) return;

  const ctx = RequestContextStorage.get();
  const actor = {
    userId: ctx?.user?.userId ?? undefined,
    correlationId: ctx?.correlationId ?? undefined,
    ipAddress: ctx?.ipAddress ?? undefined,
    userAgent: ctx?.userAgent ?? undefined,
  };

  await tx.domainEventOutbox.createMany({
    data: events.map((event) => ({
      aggregateId: event.aggregateId,
      tenantId: event.tenantId ?? undefined,
      eventId: event.eventId,
      eventName: event.eventName,
      payload: event as unknown as Prisma.InputJsonValue,
      ...actor,
    })),
    skipDuplicates: true,
  });
}
