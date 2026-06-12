import { AsyncLocalStorage } from 'async_hooks';

export interface UserContext {
  userId: string;
  firebaseUid: string;
  email: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
}

export interface RequestContext {
  correlationId: string;
  tenantId?: string;
  user?: UserContext;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Per-request context backed by AsyncLocalStorage so any layer
 * (handlers, repositories, event handlers) can read the current
 * user/tenant without threading parameters through every call.
 */
export class RequestContextStorage {
  private static readonly storage = new AsyncLocalStorage<RequestContext>();

  static run<T>(context: RequestContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  static get(): RequestContext | undefined {
    return this.storage.getStore();
  }

  static getCorrelationId(): string | undefined {
    return this.storage.getStore()?.correlationId;
  }

  static getTenantId(): string | undefined {
    return this.storage.getStore()?.tenantId;
  }

  static getUser(): UserContext | undefined {
    return this.storage.getStore()?.user;
  }

  static setUser(user: UserContext): void {
    const store = this.storage.getStore();
    if (store) {
      store.user = user;
      store.tenantId = store.tenantId ?? user.tenantId;
    }
  }

  static setTenantId(tenantId: string): void {
    const store = this.storage.getStore();
    if (store) store.tenantId = tenantId;
  }
}
