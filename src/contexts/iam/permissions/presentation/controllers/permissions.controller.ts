import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from '@contexts/iam/auth/presentation/decorators/permissions.decorator';
import { GetPermissionsQuery } from '../../application/queries/get-permissions.query';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller({ path: 'permissions', version: '1' })
export class PermissionsController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get()
  @Permissions('permissions.read')
  @ApiOperation({ summary: 'List the permissions catalog' })
  @ApiQuery({ name: 'module', required: false })
  async findAll(@Query('module') module?: string) {
    return this.queryBus.execute(new GetPermissionsQuery(module));
  }
}
