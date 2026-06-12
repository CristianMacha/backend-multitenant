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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaginationQueryDto } from '@shared/presentation/dto/pagination.dto';
import { Roles } from '@contexts/iam/auth/presentation/decorators/roles.decorator';
import {
  CreateTenantCommand,
  DeleteTenantCommand,
  UpdateTenantCommand,
} from '../../application/commands/tenant.commands';
import {
  GetTenantByIdQuery,
  GetTenantsQuery,
} from '../../application/queries/tenant.queries';
import { CreateTenantDto, UpdateTenantDto } from '../dto/tenant.dto';

@ApiTags('Tenants')
@ApiBearerAuth()
@Roles('SUPER_ADMIN')
@Controller({ path: 'tenants', version: '1' })
export class TenantsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a tenant (SUPER_ADMIN only)' })
  async create(@Body() dto: CreateTenantDto): Promise<{ id: string }> {
    return this.commandBus.execute(new CreateTenantCommand(dto.name, dto.slug));
  }

  @Get()
  @ApiOperation({ summary: 'List tenants (paginated, SUPER_ADMIN only)' })
  async findAll(@Query() pagination: PaginationQueryDto) {
    return this.queryBus.execute(
      new GetTenantsQuery(pagination.page, pagination.limit, pagination.search),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tenant by id (SUPER_ADMIN only)' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.queryBus.execute(new GetTenantByIdQuery(id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tenant (SUPER_ADMIN only)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
  ): Promise<void> {
    await this.commandBus.execute(new UpdateTenantCommand(id, dto));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a tenant (SUPER_ADMIN only)' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.commandBus.execute(new DeleteTenantCommand(id));
  }
}
