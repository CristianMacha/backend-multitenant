import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, ValidateIf } from 'class-validator';

export class LinkContactToAccountDto {
  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description: 'Account id to link, or null to unlink.',
  })
  @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @IsUUID()
  accountId!: string | null;
}
