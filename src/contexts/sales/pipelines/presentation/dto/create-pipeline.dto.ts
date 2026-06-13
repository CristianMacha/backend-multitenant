import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export enum StageTypeDto {
  OPEN = 'OPEN',
  WON = 'WON',
  LOST = 'LOST',
}

export class CreateStageDto {
  @ApiProperty({ example: 'New Lead' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ minimum: 0, maximum: 100, example: 10 })
  @IsInt()
  @Min(0)
  @Max(100)
  probability!: number;

  @ApiProperty({ enum: StageTypeDto, example: StageTypeDto.OPEN })
  @IsEnum(StageTypeDto)
  type!: StageTypeDto;
}

export class CreatePipelineDto {
  @ApiProperty({ example: 'Default sales pipeline' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({ type: [CreateStageDto], minItems: 2 })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateStageDto)
  stages!: CreateStageDto[];
}
