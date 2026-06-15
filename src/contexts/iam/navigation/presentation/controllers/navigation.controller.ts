import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiStandardResponse } from '@shared/presentation/swagger/api-standard-response.decorator';
import { CurrentUser } from '@contexts/iam/auth/presentation/decorators/current-user.decorator';
import { UserContext } from '@shared/context/request-context';
import { GetNavigationQuery } from '../../application/get-navigation/get-navigation.query';
import { NavigationItemResponseDto } from '../dto/navigation-item-response.dto';

@ApiTags('Navigation')
@ApiBearerAuth()
@Controller({ path: 'navigation', version: '1' })
export class NavigationController {
  constructor(private readonly queryBus: QueryBus) {}

  // No @Permissions/@Roles by design: any authenticated user may fetch their own navigation.
  // The response is already scoped to the caller's permissions inside GetNavigationQuery.
  @Get()
  @ApiOperation({
    summary: 'Get sidebar menu filtered by the current user permissions',
  })
  @ApiStandardResponse({ type: NavigationItemResponseDto, isArray: true })
  getNavigation(@CurrentUser() user: UserContext) {
    return this.queryBus.execute(new GetNavigationQuery(user));
  }
}
