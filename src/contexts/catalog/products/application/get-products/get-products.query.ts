export class GetProductsQuery {
  constructor(
    readonly tenantId: string,
    readonly page: number,
    readonly limit: number,
    readonly type?: string,
    readonly category?: string,
    readonly status?: string,
  ) {}
}
