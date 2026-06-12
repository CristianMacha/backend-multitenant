import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '@shared/presentation/dto/pagination.dto';

export class AuditLogsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'user' })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ example: 'created' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
