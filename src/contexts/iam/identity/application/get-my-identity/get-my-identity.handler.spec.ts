import { EntityNotFoundException } from '@shared/exceptions';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { UserContext } from '@shared/context/request-context';
import { GetMyIdentityHandler } from './get-my-identity.handler';
import { GetMyIdentityQuery } from './get-my-identity.query';

const makeUser = (overrides: Partial<UserContext> = {}): UserContext => ({
  userId: 'user-1',
  firebaseUid: 'fb-1',
  email: 'user@example.com',
  tenantId: 'tenant-1',
  roles: ['ADMIN'],
  permissions: ['users.read'],
  isPlatformAdmin: false,
  ...overrides,
});

const makePrisma = (row: { firstName: string; lastName: string } | null) => {
  const findFirst = jest.fn().mockResolvedValue(row);
  const prisma = { user: { findFirst } } as unknown as PrismaService;
  return { prisma, findFirst };
};

describe('GetMyIdentityHandler', () => {
  it('returns the complete and correct identity read model', async () => {
    const { prisma } = makePrisma({ firstName: 'John', lastName: 'Doe' });
    const handler = new GetMyIdentityHandler(prisma);
    const user = makeUser();

    const result = await handler.execute(new GetMyIdentityQuery(user));

    expect(result).toEqual({
      userId: 'user-1',
      firebaseUid: 'fb-1',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      tenantId: 'tenant-1',
      roles: ['ADMIN'],
      permissions: ['users.read'],
      isPlatformAdmin: false,
    });
  });

  it('queries Prisma filtering by id, tenantId and deletedAt: null', async () => {
    const { prisma, findFirst } = makePrisma({
      firstName: 'John',
      lastName: 'Doe',
    });
    const handler = new GetMyIdentityHandler(prisma);
    const user = makeUser();

    await handler.execute(new GetMyIdentityQuery(user));

    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 'user-1', tenantId: 'tenant-1', deletedAt: null },
      select: { firstName: true, lastName: true },
    });
  });

  it('derives fullName trimming surrounding whitespace', async () => {
    const { prisma } = makePrisma({ firstName: ' Jane', lastName: 'Smith ' });
    const handler = new GetMyIdentityHandler(prisma);

    const result = await handler.execute(new GetMyIdentityQuery(makeUser()));

    expect(result.fullName).toBe('Jane Smith');
  });

  it('reflects isPlatformAdmin as boolean and keeps the same read model shape for platform admins', async () => {
    const { prisma } = makePrisma({ firstName: 'Ada', lastName: 'Lovelace' });
    const handler = new GetMyIdentityHandler(prisma);
    const user = makeUser({ isPlatformAdmin: true });

    const result = await handler.execute(new GetMyIdentityQuery(user));

    expect(result.isPlatformAdmin).toBe(true);
    expect(Object.keys(result).sort()).toEqual(
      [
        'userId',
        'firebaseUid',
        'email',
        'firstName',
        'lastName',
        'fullName',
        'tenantId',
        'roles',
        'permissions',
        'isPlatformAdmin',
      ].sort(),
    );
  });

  it('does not use any repository or eventbus — only PrismaService', () => {
    const { prisma } = makePrisma(null);
    const handler = new GetMyIdentityHandler(prisma);
    expect(Object.keys(handler)).toEqual(['prisma']);
  });

  it('throws EntityNotFoundException when the user does not exist or is soft-deleted', async () => {
    const { prisma } = makePrisma(null);
    const handler = new GetMyIdentityHandler(prisma);

    await expect(
      handler.execute(new GetMyIdentityQuery(makeUser())),
    ).rejects.toThrow(EntityNotFoundException);
  });
});
