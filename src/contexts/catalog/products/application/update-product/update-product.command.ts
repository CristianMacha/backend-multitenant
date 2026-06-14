export interface UpdateProductChanges {
  name?: string;
  description?: string | null;
  category?: string | null;
  unitPriceAmount?: number;
  unitPriceCurrency?: string;
  unitOfMeasure?: string;
}

export class UpdateProductCommand {
  constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly changes: UpdateProductChanges,
  ) {}
}
