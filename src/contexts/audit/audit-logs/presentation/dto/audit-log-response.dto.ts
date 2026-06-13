import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'uuid', nullable: true })
  userId!: string | null;

  @ApiProperty({ example: 'created' })
  action!: string;

  @ApiProperty({ example: 'user' })
  entity!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  entityId!: string | null;

  @ApiPropertyOptional({ type: Object, nullable: true })
  oldValues!: unknown;

  @ApiPropertyOptional({ type: Object, nullable: true })
  newValues!: unknown;

  @ApiPropertyOptional({ type: String, nullable: true })
  ipAddress!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  userAgent!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  correlationId!: string | null;

  @ApiProperty()
  createdAt!: Date;
}
