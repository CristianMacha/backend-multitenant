import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { RequestContextStorage } from '@shared/context/request-context';

export interface AuditEntry {
  action: string;
  entity: string;
  entityId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  tenantId?: string;
  userId?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Minimal Prisma client surface shared by the service and a transaction
 * client, so an audit entry can be written either standalone or atomically
 * together with another write (e.g. marking the outbox row published).
 */
type AuditWriter = Pick<PrismaService, 'auditLog'> | Prisma.TransactionClient;

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Best-effort audit write: never throws (logs and swallows). Use when the
   * audit entry is incidental to the caller's success.
   */
  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.write(this.prisma, entry);
    } catch (error) {
      this.logger.error(
        `Failed to record audit entry for ${entry.entity}/${entry.action}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Transactional audit write: runs on the provided transaction client and
   * lets failures propagate, so the caller's transaction aborts and is
   * retried instead of committing a half-done state (e.g. outbox marked
   * published with no audit row). Used by the outbox processor.
   */
  async recordWithin(
    tx: Prisma.TransactionClient,
    entry: AuditEntry,
  ): Promise<void> {
    await this.write(tx, entry);
  }

  private async write(client: AuditWriter, entry: AuditEntry): Promise<void> {
    const context = RequestContextStorage.get();
    await client.auditLog.create({
      data: {
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        oldValues: (entry.oldValues ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        newValues: (entry.newValues ?? undefined) as
          | Prisma.InputJsonValue
          | undefined,
        tenantId:
          entry.tenantId ?? context?.tenantId ?? context?.user?.tenantId,
        userId: entry.userId ?? context?.user?.userId,
        ipAddress: entry.ipAddress ?? context?.ipAddress,
        userAgent: entry.userAgent ?? context?.userAgent,
        correlationId: entry.correlationId ?? context?.correlationId,
      },
    });
  }
}
