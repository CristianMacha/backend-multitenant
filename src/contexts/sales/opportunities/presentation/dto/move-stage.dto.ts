import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class MoveStageDto {
  @ApiProperty({ format: 'uuid', description: 'Target stage id' })
  @IsUUID()
  stageId!: string;
}
