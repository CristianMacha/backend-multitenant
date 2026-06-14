import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString } from 'class-validator';

export class RescheduleActivityDto {
  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  @Transform(({ value }: { value: string }) => new Date(value))
  dueAt!: Date;
}
