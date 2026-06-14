import { ApiProperty } from '@nestjs/swagger';

export class CrmSettingsResponseDto {
  @ApiProperty({ example: 'USD' }) defaultCurrency: string;
  @ApiProperty({ example: 'UTC' }) timezone: string;
}
