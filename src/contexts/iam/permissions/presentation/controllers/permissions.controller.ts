import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ApiStandardResponse } from '@shared/presentation/swagger/api-standard-response.decorator';
import { Permissions } from '@contexts/iam/auth/presentation/decorators/permissions.decorator';
import { Perm } from '@shared/authorization/permissions';
import { GetPermissionsQuery } from '../../application/get-permissions/get-permissions.query';
import { PermissionResponseDto } from '../dto/permission-response.dto';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller({ path: 'permissions', version: '1' })
export class PermissionsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Permissions(Perm.permissions.read)
  @ApiOperation({ summary: 'List the permissions catalog' })
  @ApiQuery({ name: 'module', required: false })
  @ApiStandardResponse({ type: PermissionResponseDto, isArray: true })
  async findAll(@Query('module') module?: string) {
    return this.queryBus.execute(new GetPermissionsQuery(module));
  }
}
