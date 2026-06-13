import { Command } from '@nestjs/cqrs';

export class CreateRoleCommand extends Command<{ id: string }> {
  constructor(
    readonly tenantId: string,
    readonly name: string,
    readonly description?: string,
  ) {
    super();
  }
}
