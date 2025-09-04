import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '../interfaces/common.interface';

/**
 * 业务异常类
 */
export class BusinessException extends HttpException {
  public readonly code: ErrorCode;
  public readonly details?: any;

  constructor(
    code: ErrorCode,
    message: string,
    details?: any,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super({ code, message, details }, httpStatus);
    this.code = code;
    this.details = details;
  }
}

/**
 * 预定义的业务异常
 */
export class BusinessExceptions {
  static invalidParams(message = '参数错误', details?: any) {
    return new BusinessException(ErrorCode.INVALID_PARAMS, message, details);
  }

  static unauthorized(message = '未授权', details?: any) {
    return new BusinessException(
      ErrorCode.UNAUTHORIZED,
      message,
      details,
      HttpStatus.UNAUTHORIZED,
    );
  }

  static forbidden(message = '无权限', details?: any) {
    return new BusinessException(
      ErrorCode.FORBIDDEN,
      message,
      details,
      HttpStatus.FORBIDDEN,
    );
  }

  static notFound(message = '资源不存在', details?: any) {
    return new BusinessException(
      ErrorCode.NOT_FOUND,
      message,
      details,
      HttpStatus.NOT_FOUND,
    );
  }

  static deviceOffline(message = '设备离线', details?: any) {
    return new BusinessException(ErrorCode.DEVICE_OFFLINE, message, details);
  }

  static deviceBusy(message = '设备使用中', details?: any) {
    return new BusinessException(ErrorCode.DEVICE_BUSY, message, details);
  }

  static paymentFailed(message = '支付失败', details?: any) {
    return new BusinessException(ErrorCode.PAYMENT_FAILED, message, details);
  }

  static deviceStartTimeout(message = '设备启动超时', details?: any) {
    return new BusinessException(ErrorCode.DEVICE_START_TIMEOUT, message, details);
  }

  static insufficientBalance(message = '余额不足', details?: any) {
    return new BusinessException(ErrorCode.INSUFFICIENT_BALANCE, message, details);
  }

  static orderStatusError(message = '订单状态错误', details?: any) {
    return new BusinessException(ErrorCode.ORDER_STATUS_ERROR, message, details);
  }
}