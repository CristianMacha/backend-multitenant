import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { AccountId, ContactId, TenantId } from '@shared/domain/types';
import { EntityNotFoundException } from '@shared/exceptions';
import {
  ACCOUNT_REPOSITORY,
  AccountRepository,
} from '@contexts/crm/accounts/domain/repositories/account.repository';
import {
  CONTACT_REPOSITORY,
  ContactRepository,
} from '../../domain/repositories/contact.repository';
import { LinkContactToAccountCommand } from './link-contact-to-account.command';

@CommandHandler(LinkContactToAccountCommand)
export class LinkContactToAccountHandler implements ICommandHandler<LinkContactToAccountCommand> {
  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepository: ContactRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: AccountRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: LinkContactToAccountCommand): Promise<void> {
    const tenantId = TenantId(command.tenantId);

    const contact = await this.contactRepository.findById(
      ContactId(command.id),
      tenantId,
    );
    if (!contact) throw new EntityNotFoundException('Contact', command.id);

    let accountId: AccountId | null = null;
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

    contact.linkToAccount(accountId);
    const events = contact.pullDomainEvents();
    await this.contactRepository.save(contact, events);
    this.eventBus.publishAll(events);
  }
}
