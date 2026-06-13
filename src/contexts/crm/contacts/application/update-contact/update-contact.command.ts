import { Command } from '@nestjs/cqrs';

export interface UpdateContactChanges {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
}

export class UpdateContactCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly changes: UpdateContactChanges,
  ) {
    super();
  }
}
