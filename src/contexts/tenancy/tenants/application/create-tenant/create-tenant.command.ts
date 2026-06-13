import { Command } from '@nestjs/cqrs';

export class CreateTenantCommand extends Command<{ id: string }> {
  constructor(
    readonly name: string,
    readonly slug: string,
  ) {
    super();
  }
}
