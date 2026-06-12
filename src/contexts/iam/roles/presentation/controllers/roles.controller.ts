import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '@shared/presentation/dto/pagination.dto';
import { Permissions } from '@contexts/iam/auth/presentation/decorators/permissions.decorator';
import { CurrentUser } from '@contexts/iam/auth/presentation/decorators/current-user.decorator';
import {
  CreateRoleCommand,
  DeleteRoleCommand,
  SetRolePermissionsCommand,
  UpdateRoleCommand,
} from '../../application/commands/role.commands';
import {
  GetRoleByIdQuery,
  GetRolesQuery,
} from '../../application/queries/role.queries';
import {
  CreateRoleDto,
  RoleResponseDto,
  SetRolePermissionsDto,
  UpdateRoleDto,
} from '../dto/role.dto';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller({ path: 'roles', version: '1' })
export class RolesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Permissions('roles.create')
  @ApiOperation({ summary: 'Create a role' })
  async create(
    @Body() dto: CreateRoleDto,
    @CurrentUser('tenantId') tenantId: string,
  ): Promise<{ id: string }> {
    return this.commandBus.execute(
      new CreateRoleCommand(tenantId, dto.name, dto.description),
    );
  }

  @Get()
  @Permissions('roles.read')
  @ApiOperation({ summary: 'List roles (paginated)' })
  @ApiOkResponse({ type: [RoleResponseDto] })
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.queryBus.execute(
      new GetRolesQuery(
        tenantId,
        pagination.page,
        pagination.limit,
        pagination.search,
      ),
    );
  }

  @Get(':id')
  @Permissions('roles.read')
  @ApiOperation({ summary: 'Get a role by id' })
  @ApiOkResponse({ type: RoleResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.queryBus.execute(new GetRoleByIdQuery(id, tenantId));
  }

  @Patch(':id')
  @Permissions('roles.update')
  @ApiOperation({ summary: 'Update a role' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @CurrentUser('tenantId') tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(new UpdateRoleCommand(id, tenantId, dto));
  }

  @Put(':id/permissions')
  @Permissions('roles.update')
  @ApiOperation({ summary: 'Replace the permissions of a role' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async setPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetRolePermissionsDto,
    @CurrentUser('tenantId') tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new SetRolePermissionsCommand(id, tenantId, dto.permissionIds),
    );
  }

  @Delete(':id')
  @Permissions('roles.delete')
  @ApiOperation({ summary: 'Soft-delete a role' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteRoleCommand(id, tenantId));
  }
}
