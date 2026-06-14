import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export enum ActivityTypeDto {
  CALL = 'CALL',
  MEETING = 'MEETING',
  EMAIL = 'EMAIL',
  TASK = 'TASK',
  NOTE = 'NOTE',
}

export enum RelatedToTypeDto {
  ACCOUNT = 'ACCOUNT',
  CONTACT = 'CONTACT',
  OPPORTUNITY = 'OPPORTUNITY',
}

export class CreateActivityDto {
  @ApiProperty({ enum: ActivityTypeDto })
  @IsEnum(ActivityTypeDto)
  type!: ActivityTypeDto;

  @ApiProperty({ example: 'Follow-up call with Acme' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  subject!: string;

  @ApiProperty({ enum: RelatedToTypeDto })
  @IsEnum(RelatedToTypeDto)
  relatedToType!: RelatedToTypeDto;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  relatedToId!: string;

  @ApiPropertyOptional({ example: 'Discussed renewal pricing' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  body?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }: { value: string }) =>
    value ? new Date(value) : undefined,
  )
  dueAt?: Date;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Owner user id. Defaults to the current user.',
  })
  @IsOptional()
  @IsUUID()
  ownerId?: string;
}
