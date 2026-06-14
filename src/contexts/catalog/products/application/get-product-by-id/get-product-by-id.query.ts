export class GetProductByIdQuery {
  constructor(
    readonly id: string,
    readonly tenantId: string,
  ) {}
}
