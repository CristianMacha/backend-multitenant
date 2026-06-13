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
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '@shared/presentation/dto/pagination.dto';
import { IdResponseDto } from '@shared/presentation/dto/standard-response.dto';
import {
  ApiPaginatedResponse,
  ApiStandardResponse,
} from '@shared/presentation/swagger/api-standard-response.decorator';
import { Permissions } from '@contexts/iam/auth/presentation/decorators/permissions.decorator';
import { Perm } from '@shared/authorization/permissions';
import { EffectiveTenantId } from '@shared/presentation/decorators/effective-tenant-id.decorator';
import { CreateRoleCommand } from '../../application/create-role/create-role.command';
import { UpdateRoleCommand } from '../../application/update-role/update-role.command';
import { DeleteRoleCommand } from '../../application/delete-role/delete-role.command';
import { SetRolePermissionsCommand } from '../../application/set-role-permissions/set-role-permissions.command';
import { GetRolesQuery } from '../../application/get-roles/get-roles.query';
import { GetRoleByIdQuery } from '../../application/get-role-by-id/get-role-by-id.query';
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
  @Permissions(Perm.roles.create)
  @ApiOperation({ summary: 'Create a role' })
  @ApiStandardResponse({ type: IdResponseDto, status: HttpStatus.CREATED })
  async create(
    @Body() dto: CreateRoleDto,
    @EffectiveTenantId() tenantId: string,
  ): Promise<{ id: string }> {
    return this.commandBus.execute(
      new CreateRoleCommand(tenantId, dto.name, dto.description),
    );
  }

  @Get()
  @Permissions(Perm.roles.read)
  @ApiOperation({ summary: 'List roles (paginated)' })
  @ApiPaginatedResponse(RoleResponseDto)
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @EffectiveTenantId() tenantId: string,
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
  @Permissions(Perm.roles.read)
  @ApiOperation({ summary: 'Get a role by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiStandardResponse({ type: RoleResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @EffectiveTenantId() tenantId: string,
  ) {
    return this.queryBus.execute(new GetRoleByIdQuery(id, tenantId));
  }

  @Patch(':id')
  @Permissions(Perm.roles.update)
  @ApiOperation({ summary: 'Update a role' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(new UpdateRoleCommand(id, tenantId, dto));
  }

  @Put(':id/permissions')
  @Permissions(Perm.roles.update)
  @ApiOperation({ summary: 'Replace the permissions of a role' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async setPermissions(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetRolePermissionsDto,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new SetRolePermissionsCommand(id, tenantId, dto.permissionIds),
    );
  }

  @Delete(':id')
  @Permissions(Perm.roles.delete)
  @ApiOperation({ summary: 'Soft-delete a role' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteRoleCommand(id, tenantId));
  }
}
