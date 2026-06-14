export class GetActivitiesQuery {
  constructor(
    readonly tenantId: string,
    readonly page: number,
    readonly limit: number,
    readonly relatedToType?: string,
    readonly relatedToId?: string,
    readonly ownerId?: string,
    readonly status?: string,
    readonly dueDateFrom?: Date,
    readonly dueDateTo?: Date,
  ) {}
}
