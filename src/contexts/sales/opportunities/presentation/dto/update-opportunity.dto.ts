import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateOpportunityDto {
  @ApiPropertyOptional({ example: 'Acme – annual licence renewal' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Send null to unlink the contact.',
  })
  @IsOptional()
  @IsUUID()
  contactId?: string | null;

  @ApiPropertyOptional({
    format: 'date-time',
    nullable: true,
    description: 'Send null to clear.',
  })
  @IsOptional()
  @IsDateString()
  expectedCloseDate?: string | null;

  @ApiPropertyOptional({ example: 15000, minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  amount?: number;

  @ApiPropertyOptional({ example: 'USD', minLength: 3, maxLength: 3 })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;
}
