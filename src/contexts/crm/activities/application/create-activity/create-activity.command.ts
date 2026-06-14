export class CreateActivityCommand {
  constructor(
    readonly tenantId: string,
    readonly ownerId: string | undefined,
    readonly type: string,
    readonly subject: string,
    readonly relatedToType: string,
    readonly relatedToId: string,
    readonly body?: string,
    readonly dueAt?: Date,
    readonly source?: string,
  ) {}
}
