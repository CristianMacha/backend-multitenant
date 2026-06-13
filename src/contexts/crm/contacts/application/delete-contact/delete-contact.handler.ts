import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { ContactId, TenantId } from '@shared/domain/types';
import { EntityNotFoundException } from '@shared/exceptions';
import {
  CONTACT_REPOSITORY,
  ContactRepository,
} from '../../domain/repositories/contact.repository';
import { DeleteContactCommand } from './delete-contact.command';

@CommandHandler(DeleteContactCommand)
export class DeleteContactHandler implements ICommandHandler<DeleteContactCommand> {
  constructor(
    @Inject(CONTACT_REPOSITORY)
    private readonly contactRepository: ContactRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: DeleteContactCommand): Promise<void> {
    const contact = await this.contactRepository.findById(
      ContactId(command.id),
      TenantId(command.tenantId),
    );
    if (!contact) throw new EntityNotFoundException('Contact', command.id);

    contact.delete();
    const events = contact.pullDomainEvents();
    await this.contactRepository.save(contact, events);
    this.eventBus.publishAll(events);
  }
}
