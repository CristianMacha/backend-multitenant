import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { GetRolesQuery } from './get-roles.query';
import { GetRolesHandler } from './get-roles.handler';

const RAW_ROLE = {
  id: 'role-1',
  tenantId: 'tenant-1',
  name: 'MANAGER',
  description: null,
  isSystem: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  rolePermissions: [],
};

const makePrisma = (rows: (typeof RAW_ROLE)[], total: number) =>
  ({
    role: {
      findMany: jest.fn().mockResolvedValue(rows),
      count: jest.fn().mockResolvedValue(total),
    },
    $transaction: jest
      .fn()
      .mockImplementation((arr: Promise<unknown>[]) => Promise.all(arr)),
  }) as unknown as PrismaService;

describe('GetRolesHandler', () => {
  it('returns paginated roles', async () => {
    const handler = new GetRolesHandler(makePrisma([RAW_ROLE], 1));
    const result = await handler.execute(new GetRolesQuery('tenant-1', 1, 10));
    expect(result.items).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('returns empty page when no roles', async () => {
    const handler = new GetRolesHandler(makePrisma([], 0));
    const result = await handler.execute(new GetRolesQuery('tenant-1', 1, 10));
    expect(result.items).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });

  it('filters by search when provided', async () => {
    const handler = new GetRolesHandler(makePrisma([RAW_ROLE], 1));
    const result = await handler.execute(
      new GetRolesQuery('tenant-1', 1, 10, 'MANAGER'),
    );
    expect(result.items).toHaveLength(1);
  });
});
