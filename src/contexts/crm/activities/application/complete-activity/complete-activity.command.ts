export class CompleteActivityCommand {
  constructor(
    readonly activityId: string,
    readonly tenantId: string,
  ) {}
}
