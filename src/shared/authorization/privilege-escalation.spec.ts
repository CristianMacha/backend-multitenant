import {
  RequestContextStorage,
  UserContext,
} from '@shared/context/request-context';
import { ForbiddenActionException } from '@shared/exceptions';
import { assertCanGrantPermissions } from './privilege-escalation';

const actor = (overrides: Partial<UserContext> = {}): UserContext => ({
  userId: 'u1',
  firebaseUid: 'fb1',
  email: 'a@b.com',
  tenantId: 't1',
  roles: [],
  permissions: [],
  isPlatformAdmin: false,
  ...overrides,
});

const runAs = (user: UserContext, fn: () => void): void =>
  RequestContextStorage.run({ correlationId: 'c1', user }, fn);

describe('assertCanGrantPermissions', () => {
  it('allows granting permissions the actor holds', () => {
    runAs(actor({ permissions: ['users.read', 'users.update'] }), () => {
      expect(() => assertCanGrantPermissions(['users.read'])).not.toThrow();
    });
  });

  it('blocks granting a permission the actor does not hold', () => {
    runAs(actor({ permissions: ['users.read'] }), () => {
      expect(() =>
        assertCanGrantPermissions(['users.read', 'tenants.create']),
      ).toThrow(ForbiddenActionException);
    });
  });

  it('lets a platform admin grant anything', () => {
    runAs(actor({ isPlatformAdmin: true, permissions: [] }), () => {
      expect(() => assertCanGrantPermissions(['tenants.delete'])).not.toThrow();
    });
  });

  it('throws when there is no actor in context', () => {
    expect(() => assertCanGrantPermissions(['users.read'])).toThrow(
      ForbiddenActionException,
    );
  });
});
