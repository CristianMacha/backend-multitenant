import { Command } from '@nestjs/cqrs';
import { StageType } from '../../domain/entities/stage.entity';

export interface CreateStageInput {
  name: string;
  probability: number;
  type: StageType;
}

export class CreatePipelineCommand extends Command<{ id: string }> {
  constructor(
    readonly tenantId: string,
    readonly name: string,
    readonly isDefault: boolean,
    readonly stages: CreateStageInput[],
  ) {
    super();
  }
}
