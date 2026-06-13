import { Command } from '@nestjs/cqrs';
import { StageType } from '../../domain/entities/stage.entity';

export class AddStageCommand extends Command<{ id: string }> {
  constructor(
    readonly pipelineId: string,
    readonly tenantId: string,
    readonly name: string,
    readonly probability: number,
    readonly type: StageType,
  ) {
    super();
  }
}
