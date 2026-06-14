import { EntityNotFoundException } from '@shared/exceptions';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { GetContactByIdQuery } from './get-contact-by-id.query';
import { GetContactByIdHandler } from './get-contact-by-id.handler';

const RAW = {
  id: 'c-1',
  tenantId: 'tenant-1',
  ownerId: 'owner-1',
  firstName: 'Jane',
  lastName: 'Doe',
  email: null,
  phone: null,
  jobTitle: null,
  accountId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const makePrisma = (row: typeof RAW | null) =>
  ({
    contact: { findFirst: jest.fn().mockResolvedValue(row) },
  }) as unknown as PrismaService;

describe('GetContactByIdHandler', () => {
  it('returns contact read model', async () => {
    const handler = new GetContactByIdHandler(makePrisma(RAW));
    const result = await handler.execute(
      new GetContactByIdQuery('c-1', 'tenant-1'),
    );
    expect(result.id).toBe('c-1');
    expect(result.firstName).toBe('Jane');
  });

  it('throws EntityNotFoundException when not found', async () => {
    const handler = new GetContactByIdHandler(makePrisma(null));
    await expect(
      handler.execute(new GetContactByIdQuery('missing', 'tenant-1')),
    ).rejects.toThrow(EntityNotFoundException);
  });
});
