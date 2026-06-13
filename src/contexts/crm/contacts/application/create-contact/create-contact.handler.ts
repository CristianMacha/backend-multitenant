import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { AccountId, TenantId, UserId } from '@shared/domain/types';
import { EntityNotFoundException } from '@shared/exceptions';
import {
  ACCOUNT_REPOSITORY,
  AccountRepository,
} from '@contexts/crm/accounts/domain/repositories/account.repository';
import { Contact } from '../../domain/entities/contact.entity';
import {
  CONTACT_REPOSITORY,
  ContactRepository,
} from '../../domain/repositories/contact.repository';
import { CreateContactCommand } from './create-contact.command';

@CommandHandler(CreateContactCommand)
export class CreateContactHandler implements ICommandHandler<CreateContactCommand> {
  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepository: ContactRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CreateContactCommand): Promise<{ id: string }> {
    const tenantId = TenantId(command.tenantId);

    let accountId: AccountId | undefined;
    if (command.accountId) {
      accountId = AccountId(command.accountId);
      const account = await this.accountRepository.findById(
        accountId,
        tenantId,
      );
      if (!account) {
        throw new EntityNotFoundException('Account', command.accountId);
      }
    }

    const contact = Contact.create({
      tenantId,
      ownerId: UserId(command.ownerId),
      firstName: command.firstName,
      lastName: command.lastName,
      email: command.email,
      phone: command.phone,
      jobTitle: command.jobTitle,
      accountId,
    });

    const events = contact.pullDomainEvents();
    await this.contactRepository.save(contact, events);
    this.eventBus.publishAll(events);

    return { id: contact.id };
  }
}
