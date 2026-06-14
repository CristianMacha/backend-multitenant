export class GetNotificationsQuery {
  constructor(
    readonly tenantId: string,
    readonly userId: string,
    readonly page: number,
    readonly limit: number,
  ) {}
}
