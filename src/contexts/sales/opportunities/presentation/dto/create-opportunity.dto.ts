import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateOpportunityDto {
  @ApiProperty({ example: 'Acme – annual licence renewal' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  accountId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  pipelineId!: string;

  @ApiProperty({ example: 12000, minimum: 0 })
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  amount!: number;

  @ApiProperty({ example: 'USD', minLength: 3, maxLength: 3 })
  @IsString()
  @Length(3, 3)
  currency!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Initial stage. Defaults to the first stage of the pipeline.',
  })
  @IsOptional()
  @IsUUID()
  stageId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Owner user id. Defaults to the current user.',
  })
  @IsOptional()
  @IsUUID()
  ownerId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  contactId?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string;
}
