import { Injectable } from '@nestjs/common';
import { randomBytes, createHash, pbkdf2Sync } from 'crypto';

@Injectable()
export class UtilsService {
  /**
   * 生成随机字符串
   */
  generateRandomString(length = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * 生成订单号
   */
  generateOrderNo(): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-T:Z.]/g, '').slice(0, 14);
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `LCH${timestamp}${random}`;
  }

  /**
   * MD5哈希
   */
  md5(input: string): string {
    return createHash('md5').update(input).digest('hex');
  }

  /**
   * SHA256哈希
   */
  sha256(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  /**
   * 密码加密
   */
  hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const passwordSalt = salt || randomBytes(16).toString('hex');
    const hash = pbkdf2Sync(password, passwordSalt, 10000, 64, 'sha256').toString('hex');
    return { hash, salt: passwordSalt };
  }

  /**
   * 验证密码
   */
  verifyPassword(password: string, hash: string, salt: string): boolean {
    const { hash: newHash } = this.hashPassword(password, salt);
    return hash === newHash;
  }

  /**
   * 手机号脱敏
   */
  maskMobile(mobile: string): string {
    if (!mobile || mobile.length !== 11) {
      return mobile;
    }
    return mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }

  /**
   * 身份证号脱敏
   */
  maskIdCard(idCard: string): string {
    if (!idCard || idCard.length < 10) {
      return idCard;
    }
    const start = idCard.slice(0, 6);
    const end = idCard.slice(-4);
    return `${start}${'*'.repeat(idCard.length - 10)}${end}`;
  }

  /**
   * 银行卡号脱敏
   */
  maskBankCard(cardNo: string): string {
    if (!cardNo || cardNo.length < 8) {
      return cardNo;
    }
    const start = cardNo.slice(0, 4);
    const end = cardNo.slice(-4);
    return `${start}${'*'.repeat(cardNo.length - 8)}${end}`;
  }

  /**
   * 分转元
   */
  centToYuan(cent: number): number {
    return Math.round(cent) / 100;
  }

  /**
   * 元转分
   */
  yuanToCent(yuan: number): number {
    return Math.round(yuan * 100);
  }

  /**
   * 格式化金额显示
   */
  formatAmount(amount: number, precision = 2): string {
    return (amount / 100).toFixed(precision);
  }

  /**
   * 时间格式化
   */
  formatDateTime(date: Date, format = 'YYYY-MM-DD HH:mm:ss'): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', year.toString())
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * 参数验证
   */
  isValidMobile(mobile: string): boolean {
    return /^1[3-9]\d{9}$/.test(mobile);
  }

  /**
   * 验证身份证号
   */
  isValidIdCard(idCard: string): boolean {
    return /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(idCard);
  }

  /**
   * 生成验证码
   */
  generateCode(length = 6): string {
    const chars = '0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 休眠函数
   */
  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 分页计算
   */
  calculatePagination(page: number, limit: number, total: number) {
    const normalizedPage = Math.max(1, page);
    const normalizedLimit = Math.max(1, Math.min(100, limit));
    const totalPages = Math.ceil(total / normalizedLimit);
    const offset = (normalizedPage - 1) * normalizedLimit;

    return {
      page: normalizedPage,
      limit: normalizedLimit,
      offset,
      totalPages,
      hasNext: normalizedPage < totalPages,
      hasPrev: normalizedPage > 1,
    };
  }
}