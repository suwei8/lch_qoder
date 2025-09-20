import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { BalanceTransaction, TransactionType, TransactionStatus } from '../entities/balance-transaction.entity';
import { User } from '../entities/user.entity';

export interface TransactionQueryOptions {
  page?: number;
  limit?: number;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
}

export interface CreateTransactionData {
  userId: number;
  type: TransactionType;
  amount: number;
  balanceUsed?: number;
  giftBalanceUsed?: number;
  balanceBefore: number;
  balanceAfter: number;
  giftBalanceBefore: number;
  giftBalanceAfter: number;
  description: string;
  orderId?: number;
  externalTransactionId?: string;
  status?: TransactionStatus;
}

@Injectable()
export class BalanceTransactionService {
  private readonly logger = new Logger(BalanceTransactionService.name);

  constructor(
    @InjectRepository(BalanceTransaction)
    private balanceTransactionRepository: Repository<BalanceTransaction>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * 创建余额交易记录
   */
  async createTransaction(data: CreateTransactionData): Promise<BalanceTransaction> {
    try {
      const transaction = this.balanceTransactionRepository.create({
        user_id: data.userId,
        type: data.type,
        amount: data.amount,
        balance_used: data.balanceUsed || 0,
        gift_balance_used: data.giftBalanceUsed || 0,
        balance_before: data.balanceBefore,
        balance_after: data.balanceAfter,
        gift_balance_before: data.giftBalanceBefore,
        gift_balance_after: data.giftBalanceAfter,
        description: data.description,
        order_id: data.orderId,
        external_transaction_id: data.externalTransactionId,
        status: data.status || TransactionStatus.SUCCESS
      });

      const savedTransaction = await this.balanceTransactionRepository.save(transaction);
      
      this.logger.log(
        `余额交易记录创建成功: 用户${data.userId}, 类型${data.type}, 金额${data.amount}分`,
        'BalanceTransactionService'
      );

      return savedTransaction;
    } catch (error) {
      this.logger.error(`创建余额交易记录失败: ${error.message}`, error.stack, 'BalanceTransactionService');
      throw error;
    }
  }

  /**
   * 获取用户余额流水
   */
  async getUserTransactions(userId: number, options: TransactionQueryOptions = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        startDate,
        endDate
      } = options;

      const queryBuilder = this.balanceTransactionRepository
        .createQueryBuilder('transaction')
        .where('transaction.user_id = :userId', { userId })
        .orderBy('transaction.created_at', 'DESC');

      // 按类型筛选
      if (type) {
        queryBuilder.andWhere('transaction.type = :type', { type });
      }

      // 按日期范围筛选
      if (startDate && endDate) {
        queryBuilder.andWhere('transaction.created_at BETWEEN :startDate AND :endDate', {
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        });
      }

      // 分页
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);

      const [transactions, total] = await queryBuilder.getManyAndCount();

      return {
        items: transactions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`获取用户余额流水失败: 用户${userId}, ${error.message}`, error.stack, 'BalanceTransactionService');
      throw error;
    }
  }

  /**
   * 获取用户余额信息
   */
  async getUserBalance(userId: number) {
    try {
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      const balance = Number(user.balance) || 0;
      const giftBalance = Number(user.gift_balance) || 0;
      const totalBalance = balance + giftBalance;

      return {
        balance,
        gift_balance: giftBalance,
        total_balance: totalBalance
      };
    } catch (error) {
      this.logger.error(`获取用户余额失败: 用户${userId}, ${error.message}`, error.stack, 'BalanceTransactionService');
      throw error;
    }
  }

  /**
   * 获取交易详情
   */
  async getTransactionDetail(userId: number, transactionId: number) {
    try {
      const transaction = await this.balanceTransactionRepository.findOne({
        where: {
          id: transactionId,
          user_id: userId
        }
      });

      if (!transaction) {
        throw new NotFoundException('交易记录不存在');
      }

      return transaction;
    } catch (error) {
      this.logger.error(`获取交易详情失败: 用户${userId}, 交易${transactionId}, ${error.message}`, error.stack, 'BalanceTransactionService');
      throw error;
    }
  }

  /**
   * 初始化测试数据
   */
  async initTestData(userId: number) {
    try {
      // 检查是否已有数据
      const existingCount = await this.balanceTransactionRepository.count({
        where: { user_id: userId }
      });

      if (existingCount > 0) {
        return { message: '测试数据已存在' };
      }

      // 获取用户当前余额
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      const currentBalance = Number(user.balance) || 0;
      const currentGiftBalance = Number(user.gift_balance) || 0;

      // 创建测试交易记录
      const testTransactions = [
        {
          type: TransactionType.RECHARGE,
          amount: 5000, // 50元
          description: '微信充值',
          balanceBefore: 0,
          balanceAfter: 5000,
          giftBalanceBefore: 0,
          giftBalanceAfter: 0,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7天前
        },
        {
          type: TransactionType.GIFT,
          amount: 1000, // 10元
          description: '首次充值赠送',
          balanceBefore: 5000,
          balanceAfter: 5000,
          giftBalanceBefore: 0,
          giftBalanceAfter: 1000,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 60000) // 7天前+1分钟
        },
        {
          type: TransactionType.CONSUMPTION,
          amount: -1500, // -15元
          description: '洗车消费 - 标准洗车',
          balanceBefore: 5000,
          balanceAfter: 4500,
          giftBalanceBefore: 1000,
          giftBalanceAfter: 500,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5天前
        },
        {
          type: TransactionType.RECHARGE,
          amount: 2000, // 20元
          description: '支付宝充值',
          balanceBefore: 4500,
          balanceAfter: 6500,
          giftBalanceBefore: 500,
          giftBalanceAfter: 500,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3天前
        },
        {
          type: TransactionType.CONSUMPTION,
          amount: -2800, // -28元
          description: '洗车消费 - 精洗套餐',
          balanceBefore: 6500,
          balanceAfter: 4200,
          giftBalanceBefore: 500,
          giftBalanceAfter: 0,
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1天前
        }
      ];

      for (const testData of testTransactions) {
        const transaction = this.balanceTransactionRepository.create({
          user_id: userId,
          type: testData.type,
          amount: Math.abs(testData.amount),
          balance_used: testData.type === TransactionType.CONSUMPTION ? Math.abs(testData.amount) : 0,
          gift_balance_used: 0,
          balance_before: testData.balanceBefore,
          balance_after: testData.balanceAfter,
          gift_balance_before: testData.giftBalanceBefore,
          gift_balance_after: testData.giftBalanceAfter,
          description: testData.description,
          status: TransactionStatus.SUCCESS,
          created_at: testData.createdAt
        });

        await this.balanceTransactionRepository.save(transaction);
      }

      // 更新用户余额为最终状态
      await this.usersRepository.update(userId, {
        balance: 935, // 9.35元
        gift_balance: 1711 // 17.11元
      });

      this.logger.log(`用户${userId}测试数据初始化完成`, 'BalanceTransactionService');

      return { message: '测试数据初始化成功' };
    } catch (error) {
      this.logger.error(`初始化测试数据失败: 用户${userId}, ${error.message}`, error.stack, 'BalanceTransactionService');
      throw error;
    }
  }
}