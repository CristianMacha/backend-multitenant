import { ApiProperty } from '@nestjs/swagger';

export class NavigationItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: () => [NavigationItemResponseDto], required: false })
  children?: NavigationItemResponseDto[];
}
