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
import { EffectiveTenantId } from '@shared/presentation/decorators/effective-tenant-id.decorator';
import { Permissions } from '@contexts/iam/auth/presentation/decorators/permissions.decorator';
import { Perm } from '@shared/authorization/permissions';
import { CreateUserCommand } from '../../application/create-user/create-user.command';
import { UpdateUserCommand } from '../../application/update-user/update-user.command';
import { DeleteUserCommand } from '../../application/delete-user/delete-user.command';
import { AssignRoleCommand } from '../../application/assign-role/assign-role.command';
import { GetUserByIdQuery } from '../../application/get-user-by-id/get-user-by-id.query';
import { GetUsersQuery } from '../../application/get-users/get-users.query';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AssignRoleDto } from '../dto/assign-role.dto';
import { UserResponseDto } from '../dto/user-response.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Permissions(Perm.users.create)
  @ApiOperation({ summary: 'Create a user in the current tenant' })
  @ApiStandardResponse({ type: IdResponseDto, status: HttpStatus.CREATED })
  async create(
    @Body() dto: CreateUserDto,
    @EffectiveTenantId() tenantId: string,
  ): Promise<{ id: string }> {
    return this.commandBus.execute(
      new CreateUserCommand(
        tenantId,
        dto.firebaseUid,
        dto.email,
        dto.firstName,
        dto.lastName,
      ),
    );
  }

  @Get()
  @Permissions(Perm.users.read)
  @ApiOperation({ summary: 'List users (paginated)' })
  @ApiPaginatedResponse(UserResponseDto)
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @EffectiveTenantId() tenantId: string,
  ) {
    return this.queryBus.execute(
      new GetUsersQuery(
        tenantId,
        pagination.page,
        pagination.limit,
        pagination.search,
      ),
    );
  }

  @Get(':id')
  @Permissions(Perm.users.read)
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiStandardResponse({ type: UserResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @EffectiveTenantId() tenantId: string,
  ) {
    return this.queryBus.execute(new GetUserByIdQuery(id, tenantId));
  }

  @Patch(':id')
  @Permissions(Perm.users.update)
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(new UpdateUserCommand(id, tenantId, dto));
  }

  @Delete(':id')
  @Permissions(Perm.users.delete)
  @ApiOperation({ summary: 'Soft-delete a user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteUserCommand(id, tenantId));
  }

  @Post(':id/roles')
  @Permissions(Perm.users.update, Perm.roles.read)
  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiParam({ name: 'id', format: 'uuid', description: 'User id' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async assignRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRoleDto,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new AssignRoleCommand(id, dto.roleId, tenantId),
    );
  }
}
