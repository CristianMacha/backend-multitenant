import { PrismaClient } from '@prisma/client';

export const TENANT_CLIENT_RESOLVER = Symbol('TENANT_CLIENT_RESOLVER');

/**
 * Strategy that maps the current tenant to the PrismaClient owning its data.
 *
 * The rest of the codebase (repositories, query handlers, services) only
 * knows `PrismaService`, which delegates every call to the client returned
 * by this resolver for the tenant active in the request context. Swapping
 * the tenancy topology is therefore a matter of binding a different
 * implementation in `PrismaModule` — domain, application and presentation
 * layers stay untouched:
 *
 * - `SharedDatabaseClientResolver` (current): single database, tenant
 *   isolation enforced by `tenant_id` filters in every query.
 * - schema-per-tenant (future): resolve a client per PostgreSQL schema
 *   (e.g. connection string with `?schema=tenant_<id>`), kept in a pool
 *   keyed by tenant id.
 * - database-per-tenant (future): look up the tenant's connection string
 *   in a control-plane catalog and pool one client per database.
 *
 * `tenantId === undefined` means there is no tenant in scope (boot, health
 * checks, seeds, cross-tenant SUPER_ADMIN operations): implementations must
 * return the control-plane/default client in that case.
 */
export interface TenantClientResolver {
  resolve(tenantId: string | undefined): PrismaClient;

  /** Disconnects every client owned by the resolver. Called on shutdown. */
  dispose(): Promise<void>;
}
