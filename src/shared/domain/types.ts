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

// --- CRM bounded contexts (crm + sales) ---
/** Compile-time alias for a CRM account (company) uuid. */
export type AccountId = Brand<string, 'AccountId'>;
/** Compile-time alias for a CRM contact (person) uuid. */
export type ContactId = Brand<string, 'ContactId'>;
/** Compile-time alias for a sales opportunity (deal) uuid. */
export type OpportunityId = Brand<string, 'OpportunityId'>;
/** Compile-time alias for a sales pipeline uuid. */
export type PipelineId = Brand<string, 'PipelineId'>;
/** Compile-time alias for a pipeline stage uuid. */
export type StageId = Brand<string, 'StageId'>;
/** Compile-time alias for a CRM activity (task/call/meeting) uuid. */
export type ActivityId = Brand<string, 'ActivityId'>;

/** Cast a raw string to TenantId. Use only at system entry points (handlers, mappers). */
export const TenantId = (v: string): TenantId => v as TenantId;
/** Cast a raw string to UserId. */
export const UserId = (v: string): UserId => v as UserId;
/** Cast a raw string to RoleId. */
export const RoleId = (v: string): RoleId => v as RoleId;
/** Cast a raw string to PermissionId. */
export const PermissionId = (v: string): PermissionId => v as PermissionId;
/** Cast a raw string to AccountId. */
export const AccountId = (v: string): AccountId => v as AccountId;
/** Cast a raw string to ContactId. */
export const ContactId = (v: string): ContactId => v as ContactId;
/** Cast a raw string to OpportunityId. */
export const OpportunityId = (v: string): OpportunityId => v as OpportunityId;
/** Cast a raw string to PipelineId. */
export const PipelineId = (v: string): PipelineId => v as PipelineId;
/** Cast a raw string to StageId. */
export const StageId = (v: string): StageId => v as StageId;
/** Cast a raw string to ActivityId. */
export const ActivityId = (v: string): ActivityId => v as ActivityId;
