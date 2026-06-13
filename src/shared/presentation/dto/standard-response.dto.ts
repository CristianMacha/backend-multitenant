import { ApiProperty } from '@nestjs/swagger';

/**
 * Swagger model of the envelope that `ResponseInterceptor` wraps around
 * every successful response. The `data` property is added per endpoint
 * by the `ApiStandardResponse`/`ApiPaginatedResponse` decorators.
 */
export class StandardResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Operation completed successfully' })
  message!: string;
}

/** Payload of creation endpoints that return the new entity id. */
export class IdResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
}
