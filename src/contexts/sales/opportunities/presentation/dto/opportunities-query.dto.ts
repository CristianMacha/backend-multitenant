import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '@shared/presentation/dto/pagination.dto';

export enum OpportunityStatusDto {
  OPEN = 'OPEN',
  WON = 'WON',
  LOST = 'LOST',
}

export class OpportunitiesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  pipelineId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  stageId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ enum: OpportunityStatusDto })
  @IsOptional()
  @IsEnum(OpportunityStatusDto)
  status?: OpportunityStatusDto;
}
