import { Command } from '@nestjs/cqrs';

export class CreateContactCommand extends Command<{ id: string }> {
  constructor(
    readonly tenantId: string,
    readonly ownerId: string,
    readonly firstName: string,
    readonly lastName: string,
    readonly email?: string,
    readonly phone?: string,
    readonly jobTitle?: string,
    readonly accountId?: string,
  ) {
    super();
  }
}
