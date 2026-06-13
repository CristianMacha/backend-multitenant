import { Command } from '@nestjs/cqrs';

export interface UpdateOpportunityChanges {
  name?: string;
  contactId?: string | null;
  expectedCloseDate?: Date | null;
  amount?: number;
  currency?: string;
}

export class UpdateOpportunityCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly changes: UpdateOpportunityChanges,
  ) {
    super();
  }
}
