import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AppException } from '../../exceptions';
import { RequestContextStorage } from '../../context/request-context';

interface ErrorResponseBody {
  success: false;
  message: string;
  code: string;
  timestamp: string;
  correlationId?: string;
  details?: unknown;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const correlationId = RequestContextStorage.getCorrelationId();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: unknown;

    if (exception instanceof AppException) {
      status = exception.status;
      message = exception.message;
      code = exception.code;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else {
        const typed = body as { message?: string | string[]; error?: string };
        message = Array.isArray(typed.message)
          ? typed.message.join('; ')
          : (typed.message ?? exception.message);
        details = Array.isArray(typed.message) ? typed.message : undefined;
      }
      code = this.httpStatusToCode(status);
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    if (status >= 500) {
      this.logger.error(
        { err: exception, correlationId },
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn({ message, code, correlationId });
    }

    const body: ErrorResponseBody = {
      success: false,
      message,
      code,
      timestamp: new Date().toISOString(),
      correlationId,
      ...(details !== undefined ? { details } : {}),
    };

    response.status(status).json(body);
  }

  private httpStatusToCode(status: number): string {
    const name = HttpStatus[status];
    return typeof name === 'string' ? name : 'HTTP_ERROR';
  }
}
