import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import type {
  ReferenceObject,
  SchemaObject,
} from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { PaginationMetaDto } from '../dto/pagination.dto';
import { StandardResponseDto } from '../dto/standard-response.dto';

interface ApiStandardResponseOptions {
  type?: Type<unknown>;
  isArray?: boolean;
  status?: number;
  description?: string;
}

const envelope = (
  dataSchema: SchemaObject | ReferenceObject,
): SchemaObject => ({
  allOf: [
    { $ref: getSchemaPath(StandardResponseDto) },
    { type: 'object', properties: { data: dataSchema }, required: ['data'] },
  ],
});

/**
 * Documents a response wrapped in the `{success, data, message}` envelope
 * produced by `ResponseInterceptor`. Without `type`, documents `data: null`
 * (e.g. 204-style operations that still return the envelope).
 */
export const ApiStandardResponse = (
  options: ApiStandardResponseOptions = {},
): MethodDecorator & ClassDecorator => {
  const {
    type,
    isArray = false,
    status = HttpStatus.OK,
    description,
  } = options;

  const dataSchema: SchemaObject | ReferenceObject = type
    ? isArray
      ? { type: 'array', items: { $ref: getSchemaPath(type) } }
      : { $ref: getSchemaPath(type) }
    : { type: 'object', nullable: true, example: null };

  return applyDecorators(
    ApiExtraModels(StandardResponseDto, ...(type ? [type] : [])),
    ApiResponse({ status, description, schema: envelope(dataSchema) }),
  );
};

/**
 * Documents a paginated response: the envelope with
 * `data: { items: Model[], meta: PaginationMetaDto }`.
 */
export const ApiPaginatedResponse = (
  type: Type<unknown>,
  description?: string,
): MethodDecorator & ClassDecorator =>
  applyDecorators(
    ApiExtraModels(StandardResponseDto, PaginationMetaDto, type),
    ApiResponse({
      status: HttpStatus.OK,
      description,
      schema: envelope({
        type: 'object',
        properties: {
          items: { type: 'array', items: { $ref: getSchemaPath(type) } },
          meta: { $ref: getSchemaPath(PaginationMetaDto) },
        },
        required: ['items', 'meta'],
      }),
    }),
  );
