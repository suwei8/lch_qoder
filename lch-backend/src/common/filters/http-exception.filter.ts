import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorCode } from '../interfaces/common.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: HttpStatus;
    let code: ErrorCode;
    let message: string;
    let details: any;

    if (exception instanceof BusinessException) {
      // 业务异常
      status = exception.getStatus();
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      // HTTP异常
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      
      if (typeof exceptionResponse === 'object') {
        code = exceptionResponse.code || ErrorCode.INVALID_PARAMS;
        message = exceptionResponse.message || exception.message;
        details = exceptionResponse.details;
      } else {
        code = ErrorCode.INVALID_PARAMS;
        message = exceptionResponse;
      }
    } else {
      // 未知异常
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = ErrorCode.INVALID_PARAMS;
      message = '服务器内部错误';
      
      // 记录未知异常日志
      this.logger.error(
        `未知异常: ${exception}`,
        exception instanceof Error ? exception.stack : undefined,
        `${request.method} ${request.url}`,
      );
    }

    const errorResponse = {
      code,
      message,
      ...(details && { details }),
      timestamp: Date.now(),
      path: request.url,
    };

    // 记录异常日志（业务异常只记录警告级别）
    if (exception instanceof BusinessException) {
      this.logger.warn(
        `业务异常: [${code}] ${message}`,
        `${request.method} ${request.url}`,
      );
    } else if (status >= 500) {
      this.logger.error(
        `服务器异常: [${status}] ${message}`,
        exception instanceof Error ? exception.stack : undefined,
        `${request.method} ${request.url}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}