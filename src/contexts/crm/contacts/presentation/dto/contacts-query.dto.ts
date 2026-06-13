import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '@shared/presentation/dto/pagination.dto';

export class ContactsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by account id' })
  @IsOptional()
  @IsUUID()
  accountId?: string;
}
