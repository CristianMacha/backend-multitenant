import { Command } from '@nestjs/cqrs';

export class DeleteUserCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
  ) {
    super();
  }
}
