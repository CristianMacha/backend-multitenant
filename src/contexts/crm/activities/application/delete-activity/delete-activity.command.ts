export class DeleteActivityCommand {
  constructor(
    readonly activityId: string,
    readonly tenantId: string,
  ) {}
}
