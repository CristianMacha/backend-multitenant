import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsNotEmpty,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { MoneyDto } from './money.dto';

/** `type` is intentionally excluded — changing the type of a product alters its nature. */
export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Widget Ultra' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'An even better widget', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ example: 'Electronics', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string | null;

  @ApiPropertyOptional({ type: MoneyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => MoneyDto)
  unitPrice?: MoneyDto;

  @ApiPropertyOptional({ example: 'kg' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  unitOfMeasure?: string;
}
