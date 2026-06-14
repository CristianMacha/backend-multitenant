export class GetDashboardSummaryQuery {
  constructor(
    readonly tenantId: string,
    readonly currentUserId: string,
    /** undefined = tenant-wide (Manager/Admin); string = scoped to that user (Agent) */
    readonly scopedOwnerId: string | undefined,
  ) {}
}
