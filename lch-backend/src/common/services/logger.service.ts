import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoggerService extends Logger {
  /**
   * 记录业务日志
   */
  business(message: string, context?: string, meta?: any) {
    const logMessage = meta ? `${message} - ${JSON.stringify(meta)}` : message;
    this.log(logMessage, context || 'Business');
  }

  /**
   * 记录安全日志
   */
  security(message: string, context?: string, meta?: any) {
    const logMessage = meta ? `${message} - ${JSON.stringify(meta)}` : message;
    this.warn(logMessage, context || 'Security');
  }

  /**
   * 记录性能日志
   */
  performance(message: string, duration: number, context?: string) {
    this.log(`${message} - 耗时: ${duration}ms`, context || 'Performance');
  }

  /**
   * 记录错误日志
   */
  errorWithContext(error: Error, context?: string, meta?: any) {
    const errorMessage = meta 
      ? `${error.message} - ${JSON.stringify(meta)}` 
      : error.message;
    this.error(errorMessage, error.stack, context || 'Error');
  }
}