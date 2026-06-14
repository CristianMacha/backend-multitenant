export class CreateProductCommand {
  constructor(
    readonly tenantId: string,
    readonly name: string,
    readonly type: string,
    readonly unitPriceAmount: number,
    readonly unitPriceCurrency: string,
    readonly unitOfMeasure: string,
    readonly description?: string,
    readonly category?: string,
  ) {}
}
