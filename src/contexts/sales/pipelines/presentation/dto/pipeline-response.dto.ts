import { ApiProperty } from '@nestjs/swagger';

export class StageResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  order!: number;

  @ApiProperty()
  probability!: number;

  @ApiProperty({ enum: ['OPEN', 'WON', 'LOST'] })
  type!: string;
}

export class PipelineResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  isDefault!: boolean;

  @ApiProperty({ type: [StageResponseDto] })
  stages!: StageResponseDto[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
