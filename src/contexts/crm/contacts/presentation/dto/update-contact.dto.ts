import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateContactDto {
  @ApiPropertyOptional({ example: 'Jane' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional({
    example: 'jane.doe@example.com',
    nullable: true,
    description: 'Send null to clear.',
  })
  @IsOptional()
  @IsEmail()
  email?: string | null;

  @ApiPropertyOptional({
    example: '+14155552671',
    nullable: true,
    description: 'Send null to clear.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @ApiPropertyOptional({
    example: 'Head of Procurement',
    nullable: true,
    description: 'Send null to clear.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  jobTitle?: string | null;
}
