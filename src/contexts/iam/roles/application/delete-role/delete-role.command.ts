import { Command } from '@nestjs/cqrs';

export class DeleteRoleCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
  ) {
    super();
  }
}
