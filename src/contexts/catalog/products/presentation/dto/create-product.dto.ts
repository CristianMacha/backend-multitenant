import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { MoneyDto } from './money.dto';

export enum ProductTypeEnum {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
}

export class CreateProductDto {
  @ApiProperty({ example: 'Widget Pro' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ enum: ProductTypeEnum, example: ProductTypeEnum.PRODUCT })
  @IsEnum(ProductTypeEnum)
  type!: ProductTypeEnum;

  @ApiProperty({ type: MoneyDto })
  @ValidateNested()
  @Type(() => MoneyDto)
  unitPrice!: MoneyDto;

  @ApiProperty({
    example: 'unit',
    description: 'Unit of measure (e.g. unit, hour, kg)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  unitOfMeasure!: string;

  @ApiPropertyOptional({ example: 'A versatile widget for all your needs' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: 'Electronics' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;
}
