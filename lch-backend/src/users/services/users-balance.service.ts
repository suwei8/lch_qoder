import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

export interface BalanceTransaction {
  type: 'recharge' | 'consumption' | 'refund' | 'gift' | 'withdraw';
  order_id?: number;
  description: string;
}

@Injectable()
export class UsersBalanceService {
  private readonly logger = new Logger(UsersBalanceService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * 增加用户余额
   */
  async addBalance(userId: number, amount: number, transaction: BalanceTransaction): Promise<void> {
    try {
      if (amount <= 0) {
        throw new BadRequestException('金额必须大于0');
      }

      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('用户不存在');
      }

      const currentBalance = Number(user.balance) || 0;
      const newBalance = currentBalance + amount;

      await this.usersRepository.update(userId, {
        balance: newBalance,
        updated_at: new Date()
      });

      // TODO: 记录余额变动日志到交易记录表
      this.logger.log(
        `用户余额增加: 用户${userId}, 金额${amount}分, 类型${transaction.type}, ` +
        `原余额${currentBalance}分, 新余额${newBalance}分`
      );

    } catch (error) {
      this.logger.error(`增加用户余额失败: 用户${userId}, 金额${amount}`, error);
      throw error;
    }
  }

  /**
   * 扣减用户余额
   */
  async deductBalance(userId: number, amount: number, transaction: BalanceTransaction): Promise<void> {
    try {
      if (amount <= 0) {
        throw new BadRequestException('金额必须大于0');
      }

      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('用户不存在');
      }

      const currentBalance = Number(user.balance) || 0;
      const giftBalance = Number(user.gift_balance) || 0;
      const totalBalance = currentBalance + giftBalance;

      if (totalBalance < amount) {
        throw new BadRequestException(`余额不足，需要${(amount/100).toFixed(2)}元，当前余额${(totalBalance/100).toFixed(2)}元`);
      }

      // 优先使用赠送余额
      let remainingAmount = amount;
      let newGiftBalance = giftBalance;
      let newBalance = currentBalance;

      if (giftBalance >= remainingAmount) {
        // 赠送余额足够
        newGiftBalance = giftBalance - remainingAmount;
        remainingAmount = 0;
      } else {
        // 赠送余额不够，需要使用普通余额
        newGiftBalance = 0;
        remainingAmount = remainingAmount - giftBalance;
        newBalance = currentBalance - remainingAmount;
      }

      await this.usersRepository.update(userId, {
        balance: newBalance,
        gift_balance: newGiftBalance,
        updated_at: new Date()
      });

      // TODO: 记录余额变动日志到交易记录表
      this.logger.log(
        `用户余额扣减: 用户${userId}, 金额${amount}分, 类型${transaction.type}, ` +
        `原余额${currentBalance}分, 新余额${newBalance}分, ` +
        `原赠送余额${giftBalance}分, 新赠送余额${newGiftBalance}分`
      );

    } catch (error) {
      this.logger.error(`扣减用户余额失败: 用户${userId}, 金额${amount}`, error);
      throw error;
    }
  }

  /**
   * 增加赠送余额
   */
  async addGiftBalance(userId: number, amount: number, transaction: BalanceTransaction): Promise<void> {
    try {
      if (amount <= 0) {
        throw new BadRequestException('金额必须大于0');
      }

      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('用户不存在');
      }

      const currentGiftBalance = Number(user.gift_balance) || 0;
      const newGiftBalance = currentGiftBalance + amount;

      await this.usersRepository.update(userId, {
        gift_balance: newGiftBalance,
        updated_at: new Date()
      });

      // TODO: 记录余额变动日志到交易记录表
      this.logger.log(
        `用户赠送余额增加: 用户${userId}, 金额${amount}分, 类型${transaction.type}, ` +
        `原赠送余额${currentGiftBalance}分, 新赠送余额${newGiftBalance}分`
      );

    } catch (error) {
      this.logger.error(`增加用户赠送余额失败: 用户${userId}, 金额${amount}`, error);
      throw error;
    }
  }

  /**
   * 获取用户余额信息
   */
  async getUserBalance(userId: number): Promise<{
    balance: number;
    gift_balance: number;
    total_balance: number;
  }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    const balance = Number(user.balance) || 0;
    const gift_balance = Number(user.gift_balance) || 0;
    const total_balance = balance + gift_balance;

    return { balance, gift_balance, total_balance };
  }
}