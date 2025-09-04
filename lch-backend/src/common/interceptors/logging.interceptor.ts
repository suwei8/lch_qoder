import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, headers, body, query } = request;
    const userAgent = headers['user-agent'] || '';
    const ip = headers['x-forwarded-for'] || request.connection.remoteAddress;
    
    const now = Date.now();
    
    // 构建请求日志上下文
    const requestContext = {
      method,
      url,
      userAgent,
      ip,
      ...(Object.keys(query).length > 0 && { query }),
      ...(body && Object.keys(body).length > 0 && { body: this.sanitizeBody(body) }),
    };

    this.logger.log(`请求开始: ${method} ${url}`, JSON.stringify(requestContext));

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        this.logger.log(`请求完成: ${method} ${url} +${responseTime}ms`);
      }),
    );
  }

  /**
   * 清理敏感信息
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***';
      }
    }

    return sanitized;
  }
}