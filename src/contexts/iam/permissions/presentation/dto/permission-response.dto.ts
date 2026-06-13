import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PermissionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'users.create' })
  code!: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Create users',
  })
  description!: string | null;

  @ApiProperty({ example: 'users' })
  module!: string;
}
