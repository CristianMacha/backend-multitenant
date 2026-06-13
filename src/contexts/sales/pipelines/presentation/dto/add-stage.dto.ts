import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { StageTypeDto } from './create-pipeline.dto';

export class AddStageDto {
  @ApiProperty({ example: 'Negotiation' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ minimum: 0, maximum: 100, example: 60 })
  @IsInt()
  @Min(0)
  @Max(100)
  probability!: number;

  @ApiProperty({ enum: StageTypeDto, example: StageTypeDto.OPEN })
  @IsEnum(StageTypeDto)
  type!: StageTypeDto;
}
