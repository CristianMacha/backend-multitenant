import { Command } from '@nestjs/cqrs';

export class DeleteContactCommand extends Command<void> {
  constructor(
    readonly id: string,
    readonly tenantId: string,
  ) {
    super();
  }
}
