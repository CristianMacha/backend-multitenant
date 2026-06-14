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
import { CreateContactCommand } from '../../application/create-contact/create-contact.command';
import { UpdateContactCommand } from '../../application/update-contact/update-contact.command';
import { LinkContactToAccountCommand } from '../../application/link-contact-to-account/link-contact-to-account.command';
import { DeleteContactCommand } from '../../application/delete-contact/delete-contact.command';
import { GetContactsQuery } from '../../application/get-contacts/get-contacts.query';
import { GetContactByIdQuery } from '../../application/get-contact-by-id/get-contact-by-id.query';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { LinkContactToAccountDto } from '../dto/link-contact-to-account.dto';
import { ContactsQueryDto } from '../dto/contacts-query.dto';
import { ContactResponseDto } from '../dto/contact-response.dto';

@ApiTags('Contacts')
@ApiBearerAuth()
@Controller({ path: 'contacts', version: '1' })
export class ContactsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Permissions(Perm.contacts.create)
  @ApiOperation({ summary: 'Create a contact in the current tenant' })
  @ApiStandardResponse({ type: IdResponseDto, status: HttpStatus.CREATED })
  async create(
    @Body() dto: CreateContactDto,
    @EffectiveTenantId() tenantId: string,
    @CurrentUser('userId') currentUserId: string,
  ): Promise<{ id: string }> {
    return this.commandBus.execute(
      new CreateContactCommand(
        tenantId,
        dto.ownerId ?? currentUserId,
        dto.firstName,
        dto.lastName,
        dto.email,
        dto.phone,
        dto.jobTitle,
        dto.accountId,
      ),
    );
  }

  @Get()
  @Permissions(Perm.contacts.read)
  @ApiOperation({ summary: 'List contacts (paginated, filterable by account)' })
  @ApiPaginatedResponse(ContactResponseDto)
  async findAll(
    @Query() query: ContactsQueryDto,
    @EffectiveTenantId() tenantId: string,
    @CurrentUser() user: UserContext,
  ) {
    const isManagerOrAdmin =
      user.isPlatformAdmin ||
      user.roles.includes('ADMIN') ||
      user.roles.includes('MANAGER');
    const scopedOwnerId = isManagerOrAdmin ? undefined : user.userId;

    return this.queryBus.execute(
      new GetContactsQuery(
        tenantId,
        query.page,
        query.limit,
        query.search,
        query.accountId,
        scopedOwnerId,
      ),
    );
  }

  @Get(':id')
  @Permissions(Perm.contacts.read)
  @ApiOperation({ summary: 'Get a contact by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiStandardResponse({ type: ContactResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @EffectiveTenantId() tenantId: string,
  ) {
    return this.queryBus.execute(new GetContactByIdQuery(id, tenantId));
  }

  @Patch(':id')
  @Permissions(Perm.contacts.update)
  @ApiOperation({ summary: 'Update a contact' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactDto,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(new UpdateContactCommand(id, tenantId, dto));
  }

  @Patch(':id/account')
  @Permissions(Perm.contacts.update)
  @ApiOperation({ summary: 'Link or unlink a contact to an account' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async linkToAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkContactToAccountDto,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new LinkContactToAccountCommand(id, tenantId, dto.accountId),
    );
  }

  @Delete(':id')
  @Permissions(Perm.contacts.delete)
  @ApiOperation({ summary: 'Soft-delete a contact' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteContactCommand(id, tenantId));
  }
}
