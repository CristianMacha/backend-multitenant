import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Length, Min } from 'class-validator';

export class MoneyDto {
  @ApiProperty({
    example: 99.99,
    description: 'Non-negative amount, max 2 decimals',
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;

  @ApiProperty({
    example: 'USD',
    description: 'ISO 4217 currency code (3 uppercase letters)',
  })
  @IsString()
  @Length(3, 3)
  currency!: string;
}
