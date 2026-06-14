import { EntityNotFoundException } from '@shared/exceptions';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { GetRoleByIdQuery } from './get-role-by-id.query';
import { GetRoleByIdHandler } from './get-role-by-id.handler';

const RAW_ROLE = {
  id: 'role-1',
  tenantId: 'tenant-1',
  name: 'MANAGER',
  description: 'Manager role',
  isSystem: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  rolePermissions: [{ permission: { code: 'users.read' } }],
};

const makePrisma = (row: typeof RAW_ROLE | null) =>
  ({
    role: { findFirst: jest.fn().mockResolvedValue(row) },
  }) as unknown as PrismaService;

describe('GetRoleByIdHandler', () => {
  it('returns role read model with permissions', async () => {
    const handler = new GetRoleByIdHandler(makePrisma(RAW_ROLE));
    const result = await handler.execute(
      new GetRoleByIdQuery('role-1', 'tenant-1'),
    );
    expect(result.id).toBe('role-1');
    expect(result.permissions).toContain('users.read');
  });

  it('throws EntityNotFoundException when role not found', async () => {
    const handler = new GetRoleByIdHandler(makePrisma(null));
    await expect(
      handler.execute(new GetRoleByIdQuery('missing', 'tenant-1')),
    ).rejects.toThrow(EntityNotFoundException);
  });
});
