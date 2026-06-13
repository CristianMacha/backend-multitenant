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
import { PlatformAdmin } from '@contexts/iam/auth/presentation/decorators/platform-admin.decorator';
import { CreateTenantCommand } from '../../application/create-tenant/create-tenant.command';
import { UpdateTenantCommand } from '../../application/update-tenant/update-tenant.command';
import { DeleteTenantCommand } from '../../application/delete-tenant/delete-tenant.command';
import { GetTenantsQuery } from '../../application/get-tenants/get-tenants.query';
import { GetTenantByIdQuery } from '../../application/get-tenant-by-id/get-tenant-by-id.query';
import {
  CreateTenantDto,
  TenantResponseDto,
  UpdateTenantDto,
} from '../dto/tenant.dto';

@ApiTags('Tenants')
@ApiBearerAuth()
@PlatformAdmin()
@Controller({ path: 'tenants', version: '1' })
export class TenantsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a tenant (platform admin only)' })
  @ApiStandardResponse({ type: IdResponseDto, status: HttpStatus.CREATED })
  async create(@Body() dto: CreateTenantDto): Promise<{ id: string }> {
    return this.commandBus.execute(new CreateTenantCommand(dto.name, dto.slug));
  }

  @Get()
  @ApiOperation({ summary: 'List tenants (paginated, platform admin only)' })
  @ApiPaginatedResponse(TenantResponseDto)
  async findAll(@Query() pagination: PaginationQueryDto) {
    return this.queryBus.execute(
      new GetTenantsQuery(pagination.page, pagination.limit, pagination.search),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tenant by id (platform admin only)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiStandardResponse({ type: TenantResponseDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.queryBus.execute(new GetTenantByIdQuery(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tenant (platform admin only)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
  ): Promise<void> {
    await this.commandBus.execute(new UpdateTenantCommand(id, dto));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a tenant (platform admin only)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.commandBus.execute(new DeleteTenantCommand(id));
  }
}
