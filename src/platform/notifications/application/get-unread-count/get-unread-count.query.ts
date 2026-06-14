export class GetUnreadCountQuery {
  constructor(
    readonly tenantId: string,
    readonly userId: string,
  ) {}
}
