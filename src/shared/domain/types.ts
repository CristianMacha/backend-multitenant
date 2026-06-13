declare const __brand: unique symbol;
type Brand<T, TBrand> = T & { [__brand]: TBrand };

/** Compile-time alias for a tenant uuid. Prevents `(id, tenantId)` parameter swaps. */
export type TenantId = Brand<string, 'TenantId'>;
/** Compile-time alias for a user uuid. */
export type UserId = Brand<string, 'UserId'>;
/** Compile-time alias for a role uuid. */
export type RoleId = Brand<string, 'RoleId'>;
/** Compile-time alias for a permission uuid. */
export type PermissionId = Brand<string, 'PermissionId'>;

/** Cast a raw string to TenantId. Use only at system entry points (handlers, mappers). */
export const TenantId = (v: string): TenantId => v as TenantId;
/** Cast a raw string to UserId. */
export const UserId = (v: string): UserId => v as UserId;
/** Cast a raw string to RoleId. */
export const RoleId = (v: string): RoleId => v as RoleId;
/** Cast a raw string to PermissionId. */
export const PermissionId = (v: string): PermissionId => v as PermissionId;
