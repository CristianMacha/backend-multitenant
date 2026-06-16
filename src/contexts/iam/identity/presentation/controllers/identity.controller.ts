import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiStandardResponse } from '@shared/presentation/swagger/api-standard-response.decorator';
import { CurrentUser } from '@contexts/iam/auth/presentation/decorators/current-user.decorator';
import { UserContext } from '@shared/context/request-context';
import { GetMyIdentityQuery } from '../../application/get-my-identity/get-my-identity.query';
import { IdentityResponseDto } from '../dto/identity-response.dto';

@ApiTags('Identity')
@ApiBearerAuth()
@Controller({ path: 'me', version: '1' })
export class IdentityController {
  constructor(private readonly queryBus: QueryBus) {}

  // No @Permissions/@Roles by design: any authenticated user may read their own identity.
  @Get()
  @ApiOperation({ summary: 'Get the authenticated user consolidated identity' })
  @ApiStandardResponse({ type: IdentityResponseDto })
  getMyIdentity(@CurrentUser() user: UserContext) {
    return this.queryBus.execute(new GetMyIdentityQuery(user));
  }
}
