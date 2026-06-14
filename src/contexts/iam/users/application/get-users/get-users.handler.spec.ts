import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { GetUsersQuery } from './get-users.query';
import { GetUsersHandler } from './get-users.handler';

const RAW_USER = {
  id: 'user-1',
  tenantId: 'tenant-1',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  userRoles: [],
};

const makePrisma = (rows: (typeof RAW_USER)[], total: number) =>
  ({
    user: {
      findMany: jest.fn().mockResolvedValue(rows),
      count: jest.fn().mockResolvedValue(total),
    },
    $transaction: jest
      .fn()
      .mockImplementation((arr: Promise<unknown>[]) => Promise.all(arr)),
  }) as unknown as PrismaService;

describe('GetUsersHandler', () => {
  it('returns paginated users', async () => {
    const handler = new GetUsersHandler(makePrisma([RAW_USER], 1));
    const result = await handler.execute(new GetUsersQuery('tenant-1', 1, 10));
    expect(result.items).toHaveLength(1);
    expect(result.meta.total).toBe(1);
  });

  it('returns empty page when no users', async () => {
    const handler = new GetUsersHandler(makePrisma([], 0));
    const result = await handler.execute(new GetUsersQuery('tenant-1', 1, 10));
    expect(result.items).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });

  it('filters by search when provided', async () => {
    const handler = new GetUsersHandler(makePrisma([RAW_USER], 1));
    const result = await handler.execute(
      new GetUsersQuery('tenant-1', 1, 10, 'john'),
    );
    expect(result.items).toHaveLength(1);
  });
});
