import { Command } from '@nestjs/cqrs';
import { AddressProps } from '@shared/domain/value-objects/address.vo';

export class CreateAccountCommand extends Command<{ id: string }> {
  constructor(
    readonly tenantId: string,
    readonly ownerId: string,
    readonly name: string,
    readonly industry?: string,
    readonly website?: string,
    readonly phone?: string,
    readonly address?: AddressProps,
  ) {
    super();
  }
}
