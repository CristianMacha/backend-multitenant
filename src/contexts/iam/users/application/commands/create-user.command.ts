import { Command } from '@nestjs/cqrs';

export class CreateUserCommand extends Command<{ id: string }> {
  constructor(
    readonly tenantId: string,
    readonly firebaseUid: string,
    readonly email: string,
    readonly firstName: string,
    readonly lastName: string,
  ) {
    super();
  }
}
