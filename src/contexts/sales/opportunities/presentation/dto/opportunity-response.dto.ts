import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpportunityResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ format: 'uuid' })
  accountId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  contactId!: string | null;

  @ApiProperty({ format: 'uuid' })
  pipelineId!: string;

  @ApiProperty({ format: 'uuid' })
  stageId!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  currency!: string;

  @ApiPropertyOptional({ nullable: true })
  expectedCloseDate!: Date | null;

  @ApiProperty({ format: 'uuid' })
  ownerId!: string;

  @ApiProperty({ enum: ['OPEN', 'WON', 'LOST'] })
  status!: string;

  @ApiPropertyOptional({ nullable: true })
  closedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class BoardColumnDto {
  @ApiProperty({ format: 'uuid' })
  stageId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  order!: number;

  @ApiProperty()
  probability!: number;

  @ApiProperty({ enum: ['OPEN', 'WON', 'LOST'] })
  type!: string;

  @ApiProperty()
  opportunityCount!: number;

  @ApiProperty()
  totalAmount!: number;

  @ApiProperty({ type: [OpportunityResponseDto] })
  opportunities!: OpportunityResponseDto[];
}

export class PipelineBoardResponseDto {
  @ApiProperty({ format: 'uuid' })
  pipelineId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: [BoardColumnDto] })
  columns!: BoardColumnDto[];
}
