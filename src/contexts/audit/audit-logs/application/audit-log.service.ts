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
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persists an audit entry, enriching it with the current request
   * context (user, IP, user agent, correlation id). Failures are
   * logged but never break the business operation being audited.
   */
  async record(entry: AuditEntry): Promise<void> {
    const context = RequestContextStorage.get();
    try {
      await this.prisma.auditLog.create({
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
          ipAddress: context?.ipAddress,
          userAgent: context?.userAgent,
          correlationId: context?.correlationId,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to record audit entry for ${entry.entity}/${entry.action}: ${(error as Error).message}`,
      );
    }
  }
}
