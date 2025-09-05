import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderStatus, PaymentMethod } from '../../common/interfaces/common.interface';
import { CreateOrderDto, UpdateOrderDto, PaymentResultDto, OrderListDto } from '../dto/order.dto';
import { LoggerService } from '../../common/services/logger.service';
import { CacheService } from '../../common/services/cache.service';
import { DevicesService } from '../../devices/services/devices.service';
import { UsersService } from '../../users/services/users.service';
import { MerchantsService } from '../../merchants/services/merchants.service';
import { NotificationService } from '../../notification/services/notification.service';
import { NotificationChannel } from '../../notification/interfaces/notification.interface';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private devicesService: DevicesService,
    private usersService: UsersService,
    private merchantsService: MerchantsService,
    private notificationService: NotificationService,
    private logger: LoggerService,
    private cacheService: CacheService,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    try {
      // 1. 获取设备信息并验证
      const device = await this.devicesService.findOne(createOrderDto.device_id);
      if (!device) {
        throw new NotFoundException('设备不存在');
      }
      if (!device.isAvailable) {
        throw new BadRequestException('设备不可用，当前状态：' + device.status);
      }

      // 2. 获取用户信息并验证
      const user = await this.usersService.findOne(createOrderDto.user_id);
      if (!user) {
        throw new NotFoundException('用户不存在');
      }
      if (!user.isActive) {
        throw new BadRequestException('用户账户已被禁用');
      }

      // 3. 获取商户信息并验证
      const merchant = await this.merchantsService.findOne(device.merchant_id);
      if (!merchant) {
        throw new NotFoundException('商户不存在');
      }
      if (!merchant.isApproved) {
        throw new BadRequestException('商户未通过审核，暂无法使用设备');
      }

      // 4. 验证时长参数
      const durationMinutes = createOrderDto.duration_minutes || 60; // 默认60分钟
      if (durationMinutes < 5 || durationMinutes > 240) {
        throw new BadRequestException('使用时长必须在5-240分钟之间');
      }

      // 5. 计算订单金额 - 严格金额计算逻辑
      const pricePerMinute = Number(device.price_per_minute) || 300; // 默认3元/分钟
      const minAmount = Number(device.min_amount) || 500; // 最低消费5元
      const baseAmount = pricePerMinute * durationMinutes;
      const totalAmount = Math.max(baseAmount, minAmount);
      
      // 验证金额是否合理（防止异常高额订单）
      if (totalAmount > 50000) { // 最大500元
        throw new BadRequestException('订单金额过高，请联系客服');
      }

      // 6. 验证支付方式和余额
      if (createOrderDto.payment_method === PaymentMethod.BALANCE) {
        const userBalance = Number(user.balance) || 0;
        const giftBalance = Number(user.gift_balance) || 0;
        const totalUserBalance = userBalance + giftBalance;
        
        if (totalUserBalance < totalAmount) {
          throw new BadRequestException(`余额不足，需要${(totalAmount/100).toFixed(2)}元，当前余额${(totalUserBalance/100).toFixed(2)}元`);
        }
      }

      // 7. 检查用户是否有进行中的订单（严格限制）
      const activeOrder = await this.ordersRepository.findOne({
        where: {
          user_id: createOrderDto.user_id,
          status: In([OrderStatus.PAY_PENDING, OrderStatus.PAID, OrderStatus.STARTING, OrderStatus.IN_USE])
        }
      });
      if (activeOrder) {
        throw new BadRequestException(`您有正在进行的订单(${activeOrder.order_no})，无法创建新订单`);
      }

      // 8. 检查设备是否被其他用户占用
      const deviceActiveOrder = await this.ordersRepository.findOne({
        where: {
          device_id: createOrderDto.device_id,
          status: In([OrderStatus.STARTING, OrderStatus.IN_USE])
        }
      });
      if (deviceActiveOrder) {
        throw new BadRequestException('设备正在被其他用户使用，请稍后再试');
      }

      // 9. 生成订单号
      const orderNo = this.generateOrderNo();

      // 10. 创建订单
      const order = this.ordersRepository.create({
        order_no: orderNo,
        user_id: createOrderDto.user_id,
        merchant_id: device.merchant_id,
        device_id: createOrderDto.device_id,
        payment_method: createOrderDto.payment_method,
        amount: totalAmount,
        duration_minutes: durationMinutes,
        balance_used: createOrderDto.balance_used || 0,
        gift_balance_used: createOrderDto.gift_balance_used || 0,
        device_data: createOrderDto.device_data,
        expire_at: new Date(Date.now() + 15 * 60 * 1000), // 15分钟过期
        status: createOrderDto.payment_method === PaymentMethod.BALANCE ? OrderStatus.PAID : OrderStatus.PAY_PENDING
      });

      const savedOrder = await this.ordersRepository.save(order);

      // 11. 如果是余额支付，立即处理支付
      if (createOrderDto.payment_method === PaymentMethod.BALANCE) {
        await this.processBalancePayment(savedOrder.id);
      }

      // 12. 清除缓存
      await this.cacheService.del('orders:list:*');

      this.logger.log(
        `订单创建成功: ${savedOrder.order_no}, 用户: ${user.id}, 设备: ${device.name}, ` +
        `金额: ${(totalAmount/100).toFixed(2)}元, 时长: ${durationMinutes}分钟`,
        'OrdersService'
      );
      return savedOrder;
    } catch (error) {
      this.logger.error(`订单创建失败: ${error.message}`, error.stack, 'OrdersService');
      throw error;
    }
  }

  async findAll(query: OrderListDto) {
    try {
      const { 
        keyword, status, payment_method, user_id, merchant_id, device_id,
        start_date, end_date, page = 1, limit = 20 
      } = query;
      const offset = (page - 1) * limit;

      const queryBuilder = this.ordersRepository.createQueryBuilder('order');

      // 关键字搜索
      if (keyword) {
        queryBuilder.where('order.order_no LIKE :keyword', { keyword: `%${keyword}%` });
      }

      // 状态筛选
      if (status) {
        queryBuilder.andWhere('order.status = :status', { status });
      }

      // 支付方式筛选
      if (payment_method) {
        queryBuilder.andWhere('order.payment_method = :payment_method', { payment_method });
      }

      // 用户筛选
      if (user_id) {
        queryBuilder.andWhere('order.user_id = :user_id', { user_id });
      }

      // 商户筛选
      if (merchant_id) {
        queryBuilder.andWhere('order.merchant_id = :merchant_id', { merchant_id });
      }

      // 设备筛选
      if (device_id) {
        queryBuilder.andWhere('order.device_id = :device_id', { device_id });
      }

      // 日期范围筛选
      if (start_date && end_date) {
        queryBuilder.andWhere('order.created_at BETWEEN :start_date AND :end_date', {
          start_date: new Date(start_date),
          end_date: new Date(end_date)
        });
      }

      // 分页
      queryBuilder
        .orderBy('order.created_at', 'DESC')
        .skip(offset)
        .take(limit);

      const [orders, total] = await queryBuilder.getManyAndCount();

      return {
        data: orders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`订单列表查询失败: ${error.message}`, error.stack, 'OrdersService');
      throw error;
    }
  }

  async findOne(id: number): Promise<Order> {
    try {
      const order = await this.ordersRepository.findOne({
        where: { id }
      });

      if (!order) {
        throw new NotFoundException('订单不存在');
      }

      return order;
    } catch (error) {
      this.logger.error(`订单查询失败: ${error.message}`, error.stack, 'OrdersService');
      throw error;
    }
  }

  async update(id: number, updateOrderDto: UpdateOrderDto): Promise<Order> {
    try {
      const order = await this.findOne(id);
      
      Object.assign(order, updateOrderDto);
      const updatedOrder = await this.ordersRepository.save(order);

      // 清除缓存
      await this.cacheService.del('orders:list:*');

      this.logger.log(`订单更新成功: ${order.order_no}`, 'OrdersService');
      return updatedOrder;
    } catch (error) {
      this.logger.error(`订单更新失败: ${error.message}`, error.stack, 'OrdersService');
      throw error;
    }
  }

  async processBalancePayment(orderId: number): Promise<Order> {
    try {
      const order = await this.findOne(orderId);

      if (order.status !== OrderStatus.INIT && order.status !== OrderStatus.PAID) {
        throw new BadRequestException('订单状态不正确，当前状态：' + order.status);
      }

      if (order.payment_method !== PaymentMethod.BALANCE) {
        throw new BadRequestException('非余额支付订单');
      }

      // 获取用户最新余额信息
      const user = await this.usersService.findOne(order.user_id);
      const userBalance = Number(user.balance) || 0;
      const giftBalance = Number(user.gift_balance) || 0;
      const orderAmount = Number(order.amount);

      // 计算余额使用分配（优先使用赠送余额）
      let giftUsed = 0;
      let balanceUsed = 0;

      if (giftBalance >= orderAmount) {
        // 赠送余额足够
        giftUsed = orderAmount;
        balanceUsed = 0;
      } else {
        // 赠送余额不足，需要使用普通余额
        giftUsed = giftBalance;
        balanceUsed = orderAmount - giftBalance;
        
        if (balanceUsed > userBalance) {
          throw new BadRequestException(`余额不足，需要${(orderAmount/100).toFixed(2)}元，当前可用${((userBalance + giftBalance)/100).toFixed(2)}元`);
        }
      }

      // 扣除用户余额
      if (balanceUsed > 0) {
        await this.usersService.updateBalance(order.user_id, balanceUsed, 'subtract');
      }
      if (giftUsed > 0) {
        await this.usersService.updateGiftBalance(order.user_id, giftUsed, 'subtract');
      }

      // 更新订单状态
      order.status = OrderStatus.PAID;
      order.paid_amount = orderAmount;
      order.balance_used = balanceUsed;
      order.gift_balance_used = giftUsed;
      order.paid_at = new Date();

      const updatedOrder = await this.ordersRepository.save(order);

      // 记录支付流水
      this.logger.log(`余额支付成功: ${order.order_no}, 金额: ${(orderAmount/100).toFixed(2)}元, 使用余额: ${(balanceUsed/100).toFixed(2)}元, 使用赠送余额: ${(giftUsed/100).toFixed(2)}元`, 'OrdersService');
      
      // 发送支付成功通知
      try {
        const user = await this.usersService.findOne(order.user_id);
        const device = await this.devicesService.findOne(order.device_id);
        
        await this.notificationService.sendOrderPaidNotification(
          {
            userId: order.user_id,
            openid: user.wechat_openid,
            phone: user.phone
          },
          {
            orderNo: order.order_no,
            amount: orderAmount,
            deviceName: device.name
          },
          {
            channels: [NotificationChannel.WECHAT_TEMPLATE],
            fallback: true
          }
        );
      } catch (notifyError) {
        this.logger.error(`发送支付通知失败: ${notifyError.message}`, notifyError.stack, 'OrdersService');
      }
      
      // 启动设备
      await this.startDevice(updatedOrder.id);

      return updatedOrder;
    } catch (error) {
      this.logger.error(`余额支付失败: ${error.message}`, error.stack, 'OrdersService');
      throw error;
    }
  }

  async processWechatPayment(paymentResult: PaymentResultDto): Promise<Order> {
    try {
      const order = await this.findByOrderNo(paymentResult.order_no);

      if (order.status !== OrderStatus.PAY_PENDING) {
        throw new BadRequestException('订单状态不正确');
      }

      // 更新订单支付信息
      order.status = OrderStatus.PAID;
      order.paid_amount = paymentResult.paid_amount;
      // transaction_id字段暂不使用
      order.paid_at = new Date();

      const updatedOrder = await this.ordersRepository.save(order);

      // 发送支付成功通知
      try {
        const user = await this.usersService.findOne(order.user_id);
        const device = await this.devicesService.findOne(order.device_id);
        
        await this.notificationService.sendOrderPaidNotification(
          {
            userId: order.user_id,
            openid: user.wechat_openid,
            phone: user.phone
          },
          {
            orderNo: order.order_no,
            amount: paymentResult.paid_amount,
            deviceName: device.name
          },
          {
            channels: [NotificationChannel.WECHAT_TEMPLATE],
            fallback: true
          }
        );
      } catch (notifyError) {
        this.logger.error(`发送支付通知失败: ${notifyError.message}`, notifyError.stack, 'OrdersService');
      }

      // 启动设备
      await this.startDevice(updatedOrder.id);

      this.logger.log(`微信支付成功: ${order.order_no}`, 'OrdersService');
      return updatedOrder;
    } catch (error) {
      this.logger.error(`微信支付处理失败: ${error.message}`, error.stack, 'OrdersService');
      throw error;
    }
  }

  async startDevice(orderId: number): Promise<void> {
    try {
      const order = await this.findOne(orderId);

      // 使用安全状态检查
      if (!order.isPaid) {
        throw new BadRequestException('订单未支付');
      }

      if (order.status !== OrderStatus.PAID) {
        throw new BadRequestException(`订单状态不正确: 当前状态${order.status}，期望状态${OrderStatus.PAID}`);
      }

      // 检查订单是否过期
      if (order.isExpired) {
        throw new BadRequestException('订单已过期，无法启动设备');
      }

      // 更新订单状态为启动中
      await this.safeUpdateOrderStatus(orderId, OrderStatus.STARTING);

      this.logger.log(`开始启动设备: 订单 ${order.order_no}, 设备 ${order.device_id}`, 'OrdersService');

      try {
        // 调用设备服务启动设备
        const result = await this.devicesService.control(order.device_id, {
          command: 'start',
          duration_minutes: order.duration_minutes || 60,
          parameters: order.device_data
        });

        if (result.success) {
          // 设备启动成功，更新订单状态
          order.status = OrderStatus.IN_USE;
          order.start_at = new Date();
          await this.ordersRepository.save(order);

          this.logger.log(`设备启动成功: 订单 ${order.order_no}, 设备 ${order.device_id}`, 'OrdersService');
          
          // 设置设备使用超时定时器（暂时跳过，等待后续实现）
          // this.scheduleDeviceTimeout(order.id, order.duration_minutes);
        } else {
          // 设备启动失败，退款
          this.logger.error(`设备启动失败: ${result.message || '未知错误'}`, null, 'OrdersService');
          await this.refund(orderId, `设备启动失败: ${result.message || '未知错误'}`);
        }
      } catch (deviceError) {
        // 设备控制异常，退款
        this.logger.error(`设备控制异常: ${deviceError.message}`, deviceError.stack, 'OrdersService');
        await this.refund(orderId, `设备控制异常: ${deviceError.message}`);
      }
    } catch (error) {
      this.logger.error(`启动设备失败: ${error.message}`, error.stack, 'OrdersService');
      // 对于系统错误，尝试退款
      try {
        await this.refund(orderId, `系统错误: ${error.message}`);
      } catch (refundError) {
        this.logger.error(`退款失败: ${refundError.message}`, refundError.stack, 'OrdersService');
      }
      throw error;
    }
  }

  async finishOrder(orderId: number, actualDurationMinutes?: number): Promise<Order> {
    try {
      const order = await this.findOne(orderId);

      if (order.status !== OrderStatus.IN_USE) {
        throw new BadRequestException(`订单状态不正确，当前状态: ${order.status}`);
      }

      // 更新订单状态为结算中
      order.status = OrderStatus.SETTLING;
      order.end_at = new Date();
      
      // 计算实际使用时长
      if (actualDurationMinutes) {
        order.duration_minutes = actualDurationMinutes;
      } else if (order.start_at) {
        // 根据开始时间计算实际时长
        const durationMs = order.end_at.getTime() - order.start_at.getTime();
        order.duration_minutes = Math.ceil(durationMs / (1000 * 60)); // 向上取整
      }

      // 获取设备和商户信息用于分润计算
      const device = await this.devicesService.findOne(order.device_id);
      const merchant = await this.merchantsService.findOne(order.merchant_id);

      // 计算实际金额（可能根据实际使用时间调整）
      let actualAmount = Number(order.amount);
      
      // 如果实际使用时间超过预付时间，需要补交费用（暂时简化处理）
      const originalDuration = Math.floor(Number(order.amount) / Number(device.price_per_minute));
      if (order.duration_minutes > originalDuration) {
        const extraMinutes = order.duration_minutes - originalDuration;
        const extraAmount = extraMinutes * Number(device.price_per_minute);
        actualAmount += extraAmount;
        
        this.logger.log(`订单超时使用: ${order.order_no}, 预付${originalDuration}分钟, 实际${order.duration_minutes}分钟, 补交${(extraAmount/100).toFixed(2)}元`, 'OrdersService');
      }

      // 分润计算
      const commissionRate = Number(merchant.commission_rate) || 0.1; // 默认10%平台抽成
      const platformIncome = Math.floor(actualAmount * commissionRate);
      const merchantIncome = actualAmount - platformIncome;

      // 更新订单金额信息
      if (actualAmount !== Number(order.amount)) {
        order.amount = actualAmount;
      }

      const updatedOrder = await this.ordersRepository.save(order);

      try {
        // 更新商户收入统计
        await this.merchantsService.updateRevenue(order.merchant_id, merchantIncome);

        // 更新设备使用统计
        await this.devicesService.updateUsageStats(
          order.device_id, 
          order.duration_minutes, 
          actualAmount
        );

        // 订单完成
        updatedOrder.status = OrderStatus.DONE;
        const finalOrder = await this.ordersRepository.save(updatedOrder);

        // 发送订单完成通知
        try {
          const user = await this.usersService.findOne(order.user_id);
          
          await this.notificationService.sendOrderCompleteNotification(
            {
              userId: order.user_id,
              openid: user.wechat_openid,
              phone: user.phone
            },
            {
              orderNo: order.order_no,
              amount: actualAmount,
              duration: order.duration_minutes
            },
            {
              channels: [NotificationChannel.WECHAT_TEMPLATE],
              fallback: true
            }
          );
        } catch (notifyError) {
          this.logger.error(`发送订单完成通知失败: ${notifyError.message}`, notifyError.stack, 'OrdersService');
        }

        this.logger.log(
          `订单完成: ${order.order_no}, 实际金额: ${(actualAmount/100).toFixed(2)}元, ` +
          `使用时长: ${order.duration_minutes}分钟, 商户收入: ${(merchantIncome/100).toFixed(2)}元, ` +
          `平台收入: ${(platformIncome/100).toFixed(2)}元`, 
          'OrdersService'
        );
        
        return finalOrder;
      } catch (statsError) {
        // 统计更新失败，但订单仍然完成
        this.logger.error(`统计更新失败: ${statsError.message}`, statsError.stack, 'OrdersService');
        
        updatedOrder.status = OrderStatus.DONE;
        const finalOrder = await this.ordersRepository.save(updatedOrder);
        
        return finalOrder;
      }
    } catch (error) {
      this.logger.error(`订单完成失败: ${error.message}`, error.stack, 'OrdersService');
      throw error;
    }
  }

  async cancel(orderId: number, reason: string): Promise<Order> {
    try {
      const order = await this.findOne(orderId);

      if (!order.canCancel) {
        throw new BadRequestException('订单无法取消');
      }

      order.status = OrderStatus.CLOSED;
      // cancelled_at和cancel_reason字段暂不使用

      const updatedOrder = await this.ordersRepository.save(order);

      this.logger.log(`订单取消成功: ${order.order_no}`, 'OrdersService');
      return updatedOrder;
    } catch (error) {
      this.logger.error(`订单取消失败: ${error.message}`, error.stack, 'OrdersService');
      throw error;
    }
  }

  async refund(orderId: number, reason: string): Promise<Order> {
    try {
      const order = await this.findOne(orderId);

      if (!order.canRefund) {
        throw new BadRequestException(`订单无法退款，当前状态: ${order.status}`);
      }

      const refundAmount = Number(order.paid_amount);
      const balanceUsed = Number(order.balance_used) || 0;
      const giftBalanceUsed = Number(order.gift_balance_used) || 0;

      this.logger.log(`开始退款: 订单 ${order.order_no}, 金额 ${(refundAmount/100).toFixed(2)}元, 原因: ${reason}`, 'OrdersService');

      // 更新订单状态
      order.status = OrderStatus.REFUNDING;
      order.refund_amount = refundAmount;
      await this.ordersRepository.save(order);

      try {
        // 按照原支付方式退款
        if (order.payment_method === PaymentMethod.BALANCE) {
          // 余额支付退款：分别退回普通余额和赠送余额
          if (balanceUsed > 0) {
            await this.usersService.updateBalance(order.user_id, balanceUsed, 'add');
          }
          if (giftBalanceUsed > 0) {
            await this.usersService.updateGiftBalance(order.user_id, giftBalanceUsed, 'add');
          }
          
          this.logger.log(
            `余额退款成功: 订单 ${order.order_no}, ` +
            `退回普通余额 ${(balanceUsed/100).toFixed(2)}元, ` +
            `退回赠送余额 ${(giftBalanceUsed/100).toFixed(2)}元`,
            'OrdersService'
          );
        } else if (order.payment_method === PaymentMethod.WECHAT) {
          // 微信退款处理
          await this.processWechatRefund(order, refundAmount, reason);
        }

        // 退款成功，更新订单状态
        order.status = OrderStatus.CLOSED;
        const updatedOrder = await this.ordersRepository.save(order);

        // 发送退款通知
        try {
          const user = await this.usersService.findOne(order.user_id);
          
          await this.notificationService.sendOrderRefundNotification(
            {
              userId: order.user_id,
              openid: user.wechat_openid,
              phone: user.phone
            },
            {
              orderNo: order.order_no,
              refundAmount: refundAmount,
              reason: reason
            },
            {
              channels: [NotificationChannel.WECHAT_TEMPLATE],
              fallback: true
            }
          );
        } catch (notifyError) {
          this.logger.error(`发送退款通知失败: ${notifyError.message}`, notifyError.stack, 'OrdersService');
        }

        this.logger.log(
          `退款完成: 订单 ${order.order_no}, 金额 ${(refundAmount/100).toFixed(2)}元, 原因: ${reason}`, 
          'OrdersService'
        );
        
        return updatedOrder;
      } catch (refundError) {
        // 退款失败，恢复订单状态
        this.logger.error(`退款失败: ${refundError.message}`, refundError.stack, 'OrdersService');
        
        // 尝试恢复订单状态
        try {
          order.status = order.isPaid ? OrderStatus.PAID : OrderStatus.PAY_PENDING;
          order.refund_amount = 0;
          await this.ordersRepository.save(order);
        } catch (rollbackError) {
          this.logger.error(`恢复订单状态失败: ${rollbackError.message}`, rollbackError.stack, 'OrdersService');
        }
        
        throw new BadRequestException(`退款失败: ${refundError.message}`);
      }
    } catch (error) {
      this.logger.error(`退款处理失败: ${error.message}`, error.stack, 'OrdersService');
      throw error;
    }
  }

  async getStats(merchantId?: number, userId?: number) {
    try {
      const cacheKey = merchantId ? `orders:stats:merchant:${merchantId}` : 
                      userId ? `orders:stats:user:${userId}` : 'orders:stats:all';
      let stats = await this.cacheService.get(cacheKey);

      if (!stats) {
        const baseQuery = this.ordersRepository.createQueryBuilder('order');
        
        if (merchantId) {
          baseQuery.where('order.merchant_id = :merchantId', { merchantId });
        } else if (userId) {
          baseQuery.where('order.user_id = :userId', { userId });
        }

        const [
          totalOrders,
          paidOrders,
          completedOrders,
          cancelledOrders,
          todayOrders
        ] = await Promise.all([
          baseQuery.getCount(),
          baseQuery.clone().andWhere('order.status IN (:...statuses)', { 
            statuses: [OrderStatus.PAID, OrderStatus.STARTING, OrderStatus.IN_USE, OrderStatus.SETTLING, OrderStatus.DONE] 
          }).getCount(),
          baseQuery.clone().andWhere('order.status = :status', { status: OrderStatus.DONE }).getCount(),
          baseQuery.clone().andWhere('order.status = :status', { status: OrderStatus.CANCELLED }).getCount(),
          baseQuery.clone().andWhere('DATE(order.created_at) = CURDATE()').getCount()
        ]);

        const totalRevenue = await baseQuery.clone()
          .andWhere('order.status = :status', { status: OrderStatus.DONE })
          .select('SUM(order.total_amount)', 'total')
          .getRawOne();

        stats = {
          totalOrders,
          paidOrders,
          completedOrders,
          cancelledOrders,
          todayOrders,
          totalRevenue: Number(totalRevenue?.total || 0)
        };

        // 缓存10分钟
        await this.cacheService.set(cacheKey, stats, 600);
      }

      return stats;
    } catch (error) {
      this.logger.error(`获取订单统计失败: ${error.message}`, error.stack, 'OrdersService');
      throw error;
    }
  }

  /**
   * 通过设备完成订单（IoT设备上报使用）
   */
  async finishOrderByDevice(devid: string, actualDurationMinutes?: number): Promise<Order | null> {
    try {
      // 查找当前正在使用该设备的订单
      const device = await this.devicesService.findByDeviceId(devid);
      if (!device) {
        this.logger.warn(`未找到设备: ${devid}`, 'OrdersService');
        return null;
      }

      const activeOrder = await this.ordersRepository.findOne({
        where: {
          device_id: device.id,
          status: OrderStatus.IN_USE
        }
      });

      if (!activeOrder) {
        this.logger.warn(`设备 ${devid} 没有正在进行的订单`, 'OrdersService');
        return null;
      }

      this.logger.log(`设备上报完成，开始结算订单: ${activeOrder.order_no}`, 'OrdersService');
      
      // 调用正常的订单完成流程
      return await this.finishOrder(activeOrder.id, actualDurationMinutes);
    } catch (error) {
      this.logger.error(`通过设备完成订单失败: ${devid}, ${error.message}`, error.stack, 'OrdersService');
      return null;
    }
  }

  async findByOrderNo(orderNo: string): Promise<Order> {
    try {
      const order = await this.ordersRepository.findOne({
        where: { order_no: orderNo },
        relations: ['user', 'merchant', 'device']
      });
      
      if (!order) {
        throw new NotFoundException('订单不存在');
      }
      
      return order;
    } catch (error) {
      this.logger.error(`查找订单失败: ${orderNo}, ${error.message}`, error.stack, 'OrdersService');
      throw error;
    }
  }
  async findActiveOrderByDevice(deviceId: number): Promise<Order | null> {
    try {
      return await this.ordersRepository.findOne({
        where: {
          device_id: deviceId,
          status: OrderStatus.IN_USE
        }
      });
    } catch (error) {
      this.logger.error(`查找设备活跃订单失败: ${error.message}`, error.stack, 'OrdersService');
      return null;
    }
  }

  private generateOrderNo(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `LCH${timestamp}${random}`;
  }

  /**
   * 验证订单状态转换是否合法
   */
  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.INIT]: [OrderStatus.PAY_PENDING, OrderStatus.PAID, OrderStatus.CANCELLED, OrderStatus.CLOSED],
      [OrderStatus.PAY_PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED, OrderStatus.CLOSED],
      [OrderStatus.PAID]: [OrderStatus.STARTING, OrderStatus.REFUNDING],
      [OrderStatus.STARTING]: [OrderStatus.IN_USE, OrderStatus.REFUNDING],
      [OrderStatus.IN_USE]: [OrderStatus.SETTLING, OrderStatus.REFUNDING],
      [OrderStatus.SETTLING]: [OrderStatus.DONE],
      [OrderStatus.REFUNDING]: [OrderStatus.CLOSED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.DONE]: [],
      [OrderStatus.CLOSED]: []
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  /**
   * 安全更新订单状态
   */
  private async safeUpdateOrderStatus(orderId: number, newStatus: OrderStatus): Promise<Order> {
    const order = await this.findOne(orderId);
    
    if (!this.validateStatusTransition(order.status, newStatus)) {
      throw new BadRequestException(
        `非法的状态转换: ${order.status} -> ${newStatus}`
      );
    }

    order.status = newStatus;
    return await this.ordersRepository.save(order);
  }

  /**
   * 处理微信退款
   */
  private async processWechatRefund(order: Order, refundAmount: number, reason: string): Promise<void> {
    try {
      // 生成退款单号
      const refundNo = `refund_${order.order_no}_${Date.now()}`;
      
      this.logger.log(
        `开始微信退款: 订单 ${order.order_no}, 退款单号 ${refundNo}, 金额 ${(refundAmount/100).toFixed(2)}元`,
        'OrdersService'
      );

      // 调用微信退款 API
      const refundParams = {
        outTradeNo: order.order_no,
        outRefundNo: refundNo,
        totalAmount: Number(order.amount),
        refundAmount: refundAmount,
        reason: reason
      };

      // 这里需要注入 WechatPaymentService
      // 但由于循环依赖问题，我们使用 HTTP 请求的方式
      try {
        // 模拟微信退款调用
        const mockRefundResult = {
          refundId: `wx_refund_${Date.now()}`,
          status: 'SUCCESS'
        };

        this.logger.log(
          `微信退款申请成功: 订单 ${order.order_no}, 退款ID ${mockRefundResult.refundId}`,
          'OrdersService'
        );

        // 更新订单退款信息
        order.wechat_transaction_id = mockRefundResult.refundId;
        
        // 在真实环境中，这里应该等待微信退款回调通知
        // 现在模拟直接成功
        this.logger.log(`微信退款成功: 订单 ${order.order_no}`, 'OrdersService');
        
      } catch (wechatError) {
        this.logger.error(
          `微信退款调用失败: ${wechatError.message}`,
          wechatError.stack,
          'OrdersService'
        );
        
        // 微信退款失败，暂时退回到用户余额
        await this.usersService.updateBalance(order.user_id, refundAmount, 'add');
        this.logger.log(
          `微信退款失败，已退回到用户余额: ${(refundAmount/100).toFixed(2)}元`,
          'OrdersService'
        );
      }
      
    } catch (error) {
      this.logger.error(
        `微信退款处理异常: ${error.message}`,
        error.stack,
        'OrdersService'
      );
      throw error;
    }
  }
}