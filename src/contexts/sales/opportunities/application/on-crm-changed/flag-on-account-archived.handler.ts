import { Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { AccountArchivedEvent } from '@contexts/crm/accounts/domain/events/account.events';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';

/**
 * Cross-context reaction: when an account is archived in the `crm` context,
 * surface any still-open opportunities on it. The account id is a required
 * reference, so we do not mutate the deals automatically — we log a warning so
 * the open pipeline value tied to an archived account is visible. Consumes only
 * the event payload from the EventBus.
 */
@EventsHandler(AccountArchivedEvent)
export class FlagOnAccountArchivedHandler implements IEventHandler<AccountArchivedEvent> {
  private readonly logger = new Logger(FlagOnAccountArchivedHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async handle(event: AccountArchivedEvent): Promise<void> {
    if (!event.tenantId) return;

    const openCount = await this.prisma.opportunity.count({
      where: {
        accountId: event.aggregateId,
        tenantId: event.tenantId,
        status: 'OPEN',
        deletedAt: null,
      },
    });

    if (openCount > 0) {
      this.logger.warn(
        `Account ${event.aggregateId} archived with ${openCount} open opportunity(ies) still attached`,
      );
    }
  }
}
