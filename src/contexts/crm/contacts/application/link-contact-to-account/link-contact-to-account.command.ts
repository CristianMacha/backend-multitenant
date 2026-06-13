import { Command } from '@nestjs/cqrs';

export class LinkContactToAccountCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
    /** Account id to link, or null to unlink. */
    readonly accountId: string | null,
  ) {
    super();
  }
}
