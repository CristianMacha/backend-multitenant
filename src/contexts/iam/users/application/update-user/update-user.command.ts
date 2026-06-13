import { Command } from '@nestjs/cqrs';

export class UpdateUserCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly changes: {
      firstName?: string;
      lastName?: string;
      isActive?: boolean;
    },
  ) {
    super();
  }
}
