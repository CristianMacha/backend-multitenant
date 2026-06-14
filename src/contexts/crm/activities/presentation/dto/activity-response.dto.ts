import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ActivityResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() tenantId!: string;
  @ApiProperty() type!: string;
  @ApiProperty() subject!: string;
  @ApiPropertyOptional() body?: string | null;
  @ApiPropertyOptional() dueAt?: Date | null;
  @ApiPropertyOptional() completedAt?: Date | null;
  @ApiProperty() status!: string;
  @ApiPropertyOptional() ownerId?: string | null;
  @ApiProperty() source!: string;
  @ApiProperty() relatedToType!: string;
  @ApiProperty() relatedToId!: string;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}
