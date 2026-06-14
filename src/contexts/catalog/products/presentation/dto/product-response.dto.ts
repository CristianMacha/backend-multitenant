import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MoneyResponseDto {
  @ApiProperty({ example: 99.99 })
  amount!: number;

  @ApiProperty({ example: 'USD' })
  currency!: string;
}

export class ProductResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ example: 'Widget Pro' })
  name!: string;

  @ApiPropertyOptional({ example: 'A great widget', nullable: true })
  description!: string | null;

  @ApiProperty({ example: 'PRODUCT', enum: ['PRODUCT', 'SERVICE'] })
  type!: string;

  @ApiPropertyOptional({ example: 'Electronics', nullable: true })
  category!: string | null;

  @ApiProperty({ type: MoneyResponseDto })
  unitPrice!: MoneyResponseDto;

  @ApiProperty({ example: 'unit' })
  unitOfMeasure!: string;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'ARCHIVED'] })
  status!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
