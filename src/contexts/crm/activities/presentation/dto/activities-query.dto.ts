import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '@shared/presentation/dto/pagination.dto';
import { RelatedToTypeDto } from './create-activity.dto';

export enum ActivityStatusFilter {
  OPEN = 'OPEN',
  DONE = 'DONE',
}

export class ActivitiesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: RelatedToTypeDto })
  @IsOptional()
  @IsEnum(RelatedToTypeDto)
  relatedToType?: RelatedToTypeDto;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  relatedToId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ enum: ActivityStatusFilter })
  @IsOptional()
  @IsEnum(ActivityStatusFilter)
  status?: ActivityStatusFilter;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Due date range start',
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }: { value: string }) =>
    value ? new Date(value) : undefined,
  )
  dueDateFrom?: Date;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Due date range end',
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }: { value: string }) =>
    value ? new Date(value) : undefined,
  )
  dueDateTo?: Date;
}
