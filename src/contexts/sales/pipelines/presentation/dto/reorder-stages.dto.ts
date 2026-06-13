import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class ReorderStagesDto {
  @ApiProperty({
    type: [String],
    description: 'Stage ids in the desired order (must be the full set)',
  })
  @IsArray()
  @ArrayMinSize(2)
  @IsUUID('all', { each: true })
  stageIds!: string[];
}
