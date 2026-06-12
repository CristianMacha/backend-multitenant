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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '@shared/presentation/dto/pagination.dto';
import { Permissions } from '@contexts/iam/auth/presentation/decorators/permissions.decorator';
import { CurrentUser } from '@contexts/iam/auth/presentation/decorators/current-user.decorator';
import { CreateUserCommand } from '../../application/commands/create-user.command';
import { UpdateUserCommand } from '../../application/commands/update-user.command';
import { DeleteUserCommand } from '../../application/commands/delete-user.command';
import { AssignRoleCommand } from '../../application/commands/assign-role.command';
import { GetUserByIdQuery } from '../../application/queries/get-user-by-id.query';
import { GetUsersQuery } from '../../application/queries/get-users.query';
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
  @Permissions('users.create')
  @ApiOperation({ summary: 'Create a user in the current tenant' })
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser('tenantId') tenantId: string,
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
  @Permissions('users.read')
  @ApiOperation({ summary: 'List users (paginated)' })
  @ApiOkResponse({ type: [UserResponseDto] })
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @CurrentUser('tenantId') tenantId: string,
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
  @Permissions('users.read')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiOkResponse({ type: UserResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.queryBus.execute(new GetUserByIdQuery(id, tenantId));
  }

  @Patch(':id')
  @Permissions('users.update')
  @ApiOperation({ summary: 'Update a user' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('tenantId') tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(new UpdateUserCommand(id, tenantId, dto));
  }

  @Delete(':id')
  @Permissions('users.delete')
  @ApiOperation({ summary: 'Soft-delete a user' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteUserCommand(id, tenantId));
  }

  @Post(':id/roles')
  @Permissions('users.update', 'roles.read')
  @ApiOperation({ summary: 'Assign a role to a user' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async assignRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser('tenantId') tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new AssignRoleCommand(id, dto.roleId, tenantId),
    );
  }
}
