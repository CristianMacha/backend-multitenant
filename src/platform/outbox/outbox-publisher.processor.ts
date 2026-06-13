import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { AuditLogService } from './audit-log.service';
import { OUTBOX_PUBLISH_JOB, OUTBOX_QUEUE } from './outbox.constants';

/**
 * Number of times a single outbox event is retried before it is
 * dead-lettered (failedAt set) and excluded from the drain.
 */
const MAX_ATTEMPTS = 5;

/**
 * Base metadata present on every serialized `DomainEvent`. Everything else in
 * the payload is the event-specific data we surface as the audit `newValues`.
 */
const EVENT_METADATA_KEYS = [
  'eventId',
  'occurredAt',
  'eventName',
  'aggregateId',
  'tenantId',
] as const;

/**
 * Drains unpublished events from the outbox table and writes audit log
 * entries. This is the recovery path: in-process EventBus handlers (e.g.
 * cache invalidation) run first for low latency; the outbox guarantees
 * the audit trail is never lost even if the process crashes between the
 * repository commit and the EventBus dispatch.
 */
@Processor(OUTBOX_QUEUE)
export class OutboxPublisherProcessor extends WorkerHost {
  private readonly logger = new Logger(OutboxPublisherProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== OUTBOX_PUBLISH_JOB) return;

    const pending = await this.prisma.domainEventOutbox.findMany({
      where: { publishedAt: null, failedAt: null },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    if (pending.length === 0) return;

    for (const record of pending) {
      try {
        const [entity, action] = record.eventName.split('.');
        const newValues = this.extractNewValues(record.payload);

        // Write the audit entry and mark the outbox row published atomically,
        // so a crash in between leaves the row unpublished (and retried) with
        // no audit row — never a published row without its audit entry, nor a
        // duplicate audit entry on retry.
        await this.prisma.$transaction(async (tx) => {
          await this.auditLogService.recordWithin(tx, {
            action,
            entity,
            entityId: record.aggregateId,
            tenantId: record.tenantId ?? undefined,
            newValues,
            userId: record.userId ?? undefined,
            correlationId: record.correlationId ?? undefined,
            ipAddress: record.ipAddress ?? undefined,
            userAgent: record.userAgent ?? undefined,
          });

          await tx.domainEventOutbox.update({
            where: { id: record.id },
            data: { publishedAt: new Date() },
          });
        });
      } catch (err) {
        await this.handleFailure(
          record.id,
          record.attempts,
          record.eventName,
          err,
        );
      }
    }

    this.logger.debug(`Processed ${pending.length} outbox event(s)`);
  }

  /**
   * Strips the `DomainEvent` base metadata from the serialized payload and
   * returns the event-specific data as the audit `newValues`. Honours an
   * explicit `changes` field (update events) when present.
   */
  protected extractNewValues(
    payload: unknown,
  ): Record<string, unknown> | undefined {
    if (payload === null || typeof payload !== 'object') return undefined;

    const rest = { ...(payload as Record<string, unknown>) };
    for (const key of EVENT_METADATA_KEYS) delete rest[key];

    if (rest.changes && typeof rest.changes === 'object') {
      return rest.changes as Record<string, unknown>;
    }
    return Object.keys(rest).length > 0 ? rest : undefined;
  }

  /**
   * Records a processing failure. Increments the attempt counter and
   * dead-letters the row (sets failedAt) once MAX_ATTEMPTS is reached, so a
   * poison message stops being retried and never starves newer events.
   */
  private async handleFailure(
    id: string,
    previousAttempts: number,
    eventName: string,
    err: unknown,
  ): Promise<void> {
    const attempts = previousAttempts + 1;
    const message = (err as Error).message;
    try {
      await this.prisma.domainEventOutbox.update({
        where: { id },
        data: {
          attempts,
          lastError: message,
          failedAt: attempts >= MAX_ATTEMPTS ? new Date() : null,
        },
      });
    } catch (updateErr) {
      this.logger.error(
        `Failed to record outbox failure for ${id}: ${(updateErr as Error).message}`,
      );
    }

    const dead = attempts >= MAX_ATTEMPTS ? ' (dead-lettered)' : '';
    this.logger.error(
      `Outbox event ${id} (${eventName}) failed ` +
        `(attempt ${attempts}/${MAX_ATTEMPTS})${dead}: ${message}`,
    );
  }
}
