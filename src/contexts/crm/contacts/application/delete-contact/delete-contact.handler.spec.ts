import { EventBus } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { TenantId, UserId } from '@shared/domain/types';
import { Contact } from '../../domain/entities/contact.entity';
import { ContactRepository } from '../../domain/repositories/contact.repository';
import { DeleteContactCommand } from './delete-contact.command';
import { DeleteContactHandler } from './delete-contact.handler';

const makeContact = () => {
  const c = Contact.create({
    tenantId: TenantId('tenant-1'),
    ownerId: UserId('owner-1'),
    firstName: 'Jane',
    lastName: 'Doe',
  });
  c.pullDomainEvents();
  return c;
};

const makeMocks = () => {
  const save = jest.fn().mockResolvedValue(undefined);
  const repo: ContactRepository = {
    findById: jest.fn().mockResolvedValue(makeContact()),
    findMany: jest.fn(),
    save,
  };
  const publishAll = jest.fn();
  const eventBus = { publishAll } as unknown as EventBus;
  return { repo, save, publishAll, eventBus };
};

describe('DeleteContactHandler', () => {
  it('soft-deletes a contact and publishes event', async () => {
    const { repo, save, publishAll, eventBus } = makeMocks();
    const handler = new DeleteContactHandler(repo, eventBus);
    await handler.execute(new DeleteContactCommand('c-1', 'tenant-1'));
    expect(save).toHaveBeenCalledTimes(1);
    expect(publishAll).toHaveBeenCalledTimes(1);
  });

  it('throws when contact not found', async () => {
    const { repo, eventBus } = makeMocks();
    (repo.findById as jest.Mock).mockResolvedValue(null);
    const handler = new DeleteContactHandler(repo, eventBus);
    await expect(
      handler.execute(new DeleteContactCommand('missing', 'tenant-1')),
    ).rejects.toThrow(EntityNotFoundException);
  });
});
