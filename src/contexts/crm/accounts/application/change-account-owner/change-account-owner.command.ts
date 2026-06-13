import { Command } from '@nestjs/cqrs';

export class ChangeAccountOwnerCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly ownerId: string,
  ) {
    super();
  }
}
