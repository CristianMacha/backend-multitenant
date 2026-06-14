export class GetRecordTimelineQuery {
  constructor(
    readonly tenantId: string,
    readonly relatedToType: string,
    readonly relatedToId: string,
  ) {}
}
