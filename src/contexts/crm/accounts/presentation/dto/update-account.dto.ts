import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { AddressDto } from './address.dto';

export class UpdateAccountDto {
  @ApiPropertyOptional({ example: 'Acme Corporation' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    example: 'Manufacturing',
    nullable: true,
    description: 'Send null to clear.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  industry?: string | null;

  @ApiPropertyOptional({
    example: 'https://acme.example.com',
    nullable: true,
    description: 'Send null to clear.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string | null;

  @ApiPropertyOptional({
    example: '+14155552671',
    nullable: true,
    description: 'Send null to clear.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @ApiPropertyOptional({
    type: AddressDto,
    nullable: true,
    description: 'Send null to clear.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto | null;
}
