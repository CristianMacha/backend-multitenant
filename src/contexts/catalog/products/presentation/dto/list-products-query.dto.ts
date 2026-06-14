import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '@shared/presentation/dto/pagination.dto';
import { ProductTypeEnum } from './create-product.dto';

export enum ProductStatusEnum {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export class ListProductsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ProductTypeEnum })
  @IsOptional()
  @IsEnum(ProductTypeEnum)
  type?: ProductTypeEnum;

  @ApiPropertyOptional({ example: 'Electronics' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  category?: string;

  @ApiPropertyOptional({ enum: ProductStatusEnum })
  @IsOptional()
  @IsEnum(ProductStatusEnum)
  status?: ProductStatusEnum;
}
