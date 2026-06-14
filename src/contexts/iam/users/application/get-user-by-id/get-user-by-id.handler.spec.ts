import { EntityNotFoundException } from '@shared/exceptions';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { GetUserByIdQuery } from './get-user-by-id.query';
import { GetUserByIdHandler } from './get-user-by-id.handler';

const RAW_USER = {
  id: 'user-1',
  tenantId: 'tenant-1',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  userRoles: [{ role: { name: 'ADMIN' } }],
};

const makePrisma = (row: typeof RAW_USER | null) =>
  ({
    user: { findFirst: jest.fn().mockResolvedValue(row) },
  }) as unknown as PrismaService;

describe('GetUserByIdHandler', () => {
  it('returns user read model', async () => {
    const handler = new GetUserByIdHandler(makePrisma(RAW_USER));
    const result = await handler.execute(
      new GetUserByIdQuery('user-1', 'tenant-1'),
    );
    expect(result.id).toBe('user-1');
    expect(result.roles).toContain('ADMIN');
  });

  it('throws EntityNotFoundException when user not found', async () => {
    const handler = new GetUserByIdHandler(makePrisma(null));
    await expect(
      handler.execute(new GetUserByIdQuery('missing', 'tenant-1')),
    ).rejects.toThrow(EntityNotFoundException);
  });
});
