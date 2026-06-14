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
import { Perm } from '@shared/authorization/permissions';
import { CreateProductCommand } from '../../application/create-product/create-product.command';
import { UpdateProductCommand } from '../../application/update-product/update-product.command';
import { ArchiveProductCommand } from '../../application/archive-product/archive-product.command';
import { GetProductsQuery } from '../../application/get-products/get-products.query';
import { GetProductByIdQuery } from '../../application/get-product-by-id/get-product-by-id.query';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ListProductsQueryDto } from '../dto/list-products-query.dto';
import { ProductResponseDto } from '../dto/product-response.dto';

@ApiTags('Products')
@ApiBearerAuth()
@Controller({ path: 'products', version: '1' })
export class ProductsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @Permissions(Perm.products.create)
  @ApiOperation({
    summary: 'Create a product or service in the current tenant',
  })
  @ApiStandardResponse({ type: IdResponseDto, status: HttpStatus.CREATED })
  async create(
    @Body() dto: CreateProductDto,
    @EffectiveTenantId() tenantId: string,
  ): Promise<{ id: string }> {
    return this.commandBus.execute(
      new CreateProductCommand(
        tenantId,
        dto.name,
        dto.type,
        dto.unitPrice.amount,
        dto.unitPrice.currency,
        dto.unitOfMeasure,
        dto.description,
        dto.category,
      ),
    );
  }

  @Get()
  @Permissions(Perm.products.read)
  @ApiOperation({
    summary: 'List products (paginated, filterable by type/category/status)',
  })
  @ApiPaginatedResponse(ProductResponseDto)
  async findAll(
    @Query() queryDto: ListProductsQueryDto,
    @EffectiveTenantId() tenantId: string,
  ): Promise<unknown> {
    return this.queryBus.execute(
      new GetProductsQuery(
        tenantId,
        queryDto.page,
        queryDto.limit,
        queryDto.type,
        queryDto.category,
        queryDto.status,
      ),
    );
  }

  @Get(':id')
  @Permissions(Perm.products.read)
  @ApiOperation({ summary: 'Get a product by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiStandardResponse({ type: ProductResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @EffectiveTenantId() tenantId: string,
  ): Promise<unknown> {
    return this.queryBus.execute(new GetProductByIdQuery(id, tenantId));
  }

  @Patch(':id')
  @Permissions(Perm.products.update)
  @ApiOperation({ summary: 'Update a product' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateProductCommand(id, tenantId, {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        unitPriceAmount: dto.unitPrice?.amount,
        unitPriceCurrency: dto.unitPrice?.currency,
        unitOfMeasure: dto.unitOfMeasure,
      }),
    );
  }

  @Delete(':id')
  @Permissions(Perm.products.delete)
  @ApiOperation({ summary: 'Archive (soft-delete) a product' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  @HttpCode(HttpStatus.NO_CONTENT)
  async archive(
    @Param('id', ParseUUIDPipe) id: string,
    @EffectiveTenantId() tenantId: string,
  ): Promise<void> {
    await this.commandBus.execute(new ArchiveProductCommand(id, tenantId));
  }
}
