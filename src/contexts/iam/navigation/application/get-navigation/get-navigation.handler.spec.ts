import { GetNavigationHandler } from './get-navigation.handler';
import { GetNavigationQuery } from './get-navigation.query';
import { UserContext } from '@shared/context/request-context';

const makeUser = (overrides: Partial<UserContext> = {}): UserContext => ({
  userId: 'u1',
  firebaseUid: 'fb1',
  email: 'test@example.com',
  tenantId: 't1',
  roles: [],
  permissions: [],
  isPlatformAdmin: false,
  ...overrides,
});

describe('GetNavigationHandler', () => {
  let handler: GetNavigationHandler;

  beforeEach(() => {
    handler = new GetNavigationHandler();
  });

  it('returns empty array when user has no permissions', async () => {
    const result = await handler.execute(new GetNavigationQuery(makeUser()));
    expect(result).toEqual([]);
  });

  it('returns only accessible top-level items', async () => {
    const result = await handler.execute(
      new GetNavigationQuery(makeUser({ permissions: ['dashboard.read'] })),
    );
    expect(result.map((i) => i.id)).toEqual(['dashboard']);
  });

  it('filters children and includes group only when at least one child is accessible', async () => {
    const result = await handler.execute(
      new GetNavigationQuery(
        makeUser({ permissions: ['dashboard.read', 'accounts.read'] }),
      ),
    );

    expect(result.map((i) => i.id)).toContain('crm');
    const crm = result.find((i) => i.id === 'crm');
    expect(crm?.children?.map((c) => c.id)).toEqual(['accounts']);
  });

  it('excludes group node entirely when no children are accessible', async () => {
    const result = await handler.execute(
      new GetNavigationQuery(makeUser({ permissions: ['dashboard.read'] })),
    );
    expect(result.map((i) => i.id)).not.toContain('crm');
  });

  it('excludes platformAdminOnly items for regular users even when they hold the permission', async () => {
    const result = await handler.execute(
      new GetNavigationQuery(
        makeUser({
          permissions: ['users.read', 'tenants.read'],
          isPlatformAdmin: false,
        }),
      ),
    );

    const settings = result.find((i) => i.id === 'settings');
    const tenants = settings?.children?.find(
      (c) => c.id === 'settings-tenants',
    );
    expect(tenants).toBeUndefined();
  });

  it('includes platformAdminOnly items for platform admins', async () => {
    const result = await handler.execute(
      new GetNavigationQuery(
        makeUser({
          permissions: [
            'users.read',
            'roles.read',
            'crm-settings.read',
            'audit-logs.read',
            'tenants.read',
          ],
          isPlatformAdmin: true,
        }),
      ),
    );

    const settings = result.find((i) => i.id === 'settings');
    expect(settings?.children?.map((c) => c.id)).toContain('settings-tenants');
  });

  it('returns full accessible menu for a user with all CRM permissions', async () => {
    const result = await handler.execute(
      new GetNavigationQuery(
        makeUser({
          permissions: [
            'dashboard.read',
            'accounts.read',
            'contacts.read',
            'opportunities.read',
            'activities.read',
            'products.read',
            'users.read',
            'roles.read',
            'crm-settings.read',
            'audit-logs.read',
          ],
        }),
      ),
    );

    expect(result.map((i) => i.id)).toEqual([
      'dashboard',
      'crm',
      'catalog',
      'settings',
    ]);
    const crm = result.find((i) => i.id === 'crm');
    expect(crm?.children?.map((c) => c.id)).toEqual([
      'accounts',
      'contacts',
      'pipeline',
      'activities',
    ]);
    // tenants excluded — user is not platform admin
    const settings = result.find((i) => i.id === 'settings');
    expect(
      settings?.children?.find((c) => c.id === 'settings-tenants'),
    ).toBeUndefined();
  });
});
