export class RescheduleActivityCommand {
  constructor(
    readonly activityId: string,
    readonly tenantId: string,
    readonly dueAt: Date,
  ) {}
}
