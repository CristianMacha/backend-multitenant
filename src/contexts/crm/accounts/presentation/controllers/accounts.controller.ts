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
import { CurrentUser } from '@contexts/iam/auth/presentation/decorators/current-user.decorator';
import { Perm } from '@shared/authorization/permissions';
import { UserContext } from '@shared/context/request-context';
import { CreateAccountCommand } from '../../application/create-account/create-account.command';
import { UpdateAccountCommand } from '../../application/update-account/update-account.command';
import { ArchiveAccountCommand } from '../../application/archive-account/archive-account.command';
import { ChangeAccountOwnerCommand } from '../../application/change-account-owner/change-account-owner.command';
import { GetAccountsQuery } from '../../application/get-accounts/get-accounts.query';
import { GetAccountByIdQuery } from '../../application/get-account-by-id/get-account-by-id.query';
import { CreateAccountDto } from '../dto/create-account.dto';
import { UpdateAccountDto } from '../dto/update-account.dto';
import { ChangeAccountOwnerDto } from '../dto/change-account-owner.dto';
import { AccountResponseDto } from '../dto/account-response.dto';

@ApiTags('Accounts')
@ApiBearerAuth()
@Controller({ path: 'accounts', version: '1' })
export class AccountsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Permissions(Perm.accounts.create)
  @ApiOperation({ summary: 'Create an account in the current tenant' })
  @ApiStandardResponse({ type: IdResponseDto, status: HttpStatus.CREATED })
  async create(
    @Body() dto: CreateAccountDto,
    @EffectiveTenantId() tenantId: string,
    @CurrentUser('userId') currentUserId: string,
  ): Promise<{ id: string }> {
    return this.commandBus.execute(
      new CreateAccountCommand(
        tenantId,
        dto.ownerId ?? currentUserId,
        dto.name,
        dto.industry,
        dto.website,
        dto.phone,
        dto.address,
      ),
    );
  }

  @Get()
  @Permissions(Perm.accounts.read)
  @ApiOperation({ summary: 'List accounts (paginated)' })
  @ApiPaginatedResponse(AccountResponseDto)
  async findAll(
    @Query() pagination: PaginationQueryDto,
    @EffectiveTenantId() tenantId: string,
    @CurrentUser() user: UserContext,
  ) {
    const isManagerOrAdmin =
      user.isPlatformAdmin ||
      user.roles.includes('ADMIN') ||
      user.roles.includes('MANAGER');
    const scopedOwnerId = isManagerOrAdmin ? undefined : user.userId;

    return this.queryBus.execute(
      new GetAccountsQuery(
        tenantId,
        pagination.page,
        pagination.limit,
        pagination.search,
        scopedOwnerId,
      ),
    );
  }

  @Get(':id')
  @Permissions(Perm.accounts.read)
  @ApiOperation({ summary: 'Get an account by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiStandardResponse({ type: AccountResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @EffectiveTenantId() tenantId: string,
  ) {
    return this.queryBus.execute(new GetAccountByIdQuery(id, tenantId));
  }

  @Patch(':id')
  @Permissions(Perm.accounts.update)
  @ApiOperation({ summary: 'Update an account' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAccountDto,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(new UpdateAccountCommand(id, tenantId, dto));
  }

  @Patch(':id/owner')
  @Permissions(Perm.accounts.update)
  @ApiOperation({ summary: 'Reassign an account to a new owner' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async changeOwner(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeAccountOwnerDto,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new ChangeAccountOwnerCommand(id, tenantId, dto.ownerId),
    );
  }

  @Delete(':id')
  @Permissions(Perm.accounts.delete)
  @ApiOperation({ summary: 'Archive (soft-delete) an account' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async archive(
    @Param('id', ParseUUIDPipe) id: string,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(new ArchiveAccountCommand(id, tenantId));
  }
}
