import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ReassignOpportunityDto {
  @ApiProperty({ format: 'uuid', description: 'New owner user id' })
  @IsUUID()
  ownerId!: string;
}
