import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order, OrderStatus, PaymentMethod } from '../entities/order.entity';
import { CreateOrderDto, UpdateOrderDto, PaymentResultDto, OrderListDto } from '../dto/order.dto';
import { LoggerService } from '../../common/services/logger.service';
import { CacheService } from '../../common/services/cache.service';
import { DevicesService } from '../../devices/services/devices.service';
import { UsersService } from '../../users/services/users.service';
import { MerchantsService } from '../../merchants/services/merchants.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private devicesService: DevicesService,
    private usersService: UsersService,
    private merchantsService: MerchantsService,
    private logger: LoggerService,
    private cacheService: CacheService,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    try {
      // 获取设备信息
      const device = await this.devicesService.findOne(createOrderDto.device_id);
      if (!device.isAvailable) {
        throw new BadRequestException('设备不可用');
      }

      // 获取用户信息
      const user = await this.usersService.findOne(createOrderDto.user_id);

      // 获取商户信息
      const merchant = await this.merchantsService.findOne(device.merchant_id);

      // 计算订单金额
      const totalAmount = Number(device.price_per_minute) * createOrderDto.duration_minutes;

      // 检查余额支付
      if (createOrderDto.payment_method === PaymentMethod.BALANCE) {
        if (Number(user.balance) < totalAmount) {
          throw new BadRequestException('余额不足');
        }
      }

      // 生成订单号
      const orderNo = this.generateOrderNo();

      // 创建订单
      const order = this.ordersRepository.create({
        order_no: orderNo,
        user_id: createOrderDto.user_id,
        merchant_id: device.merchant_id,
        device_id: createOrderDto.device_id,
        payment_method: createOrderDto.payment_method,
        total_amount: totalAmount,
        duration_minutes: createOrderDto.duration_minutes,
        price_per_minute: device.price_per_minute,
        commission_rate: merchant.commission_rate,
        device_params: createOrderDto.device_params,
        status: OrderStatus.INIT
      });

      const savedOrder = await this.ordersRepository.save(order);

      // 如果是余额支付，直接扣款
      if (createOrderDto.payment_method === PaymentMethod.BALANCE) {
        await this.processBalancePayment(savedOrder.id);
      }

      // 清除缓存
      await this.cacheService.del('orders:list:*');

      this.logger.log(`订单创建成功: ${savedOrder.order_no}`, 'OrdersService');
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

  async findByOrderNo(orderNo: string): Promise<Order> {
    try {
      const order = await this.ordersRepository.findOne({
        where: { order_no: orderNo }
      });

      if (!order) {
        throw new NotFoundException('订单不存在');
      }

      return order;
    } catch (error) {
      this.logger.error(`通过订单号查询失败: ${error.message}`, error.stack, 'OrdersService');
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

      if (order.status !== OrderStatus.INIT) {
        throw new BadRequestException('订单状态不正确');
      }

      if (order.payment_method !== PaymentMethod.BALANCE) {
        throw new BadRequestException('非余额支付订单');
      }

      // 扣除用户余额
      await this.usersService.updateBalance(order.user_id, Number(order.total_amount), 'subtract');

      // 更新订单状态
      order.status = OrderStatus.PAID;
      order.paid_amount = order.total_amount;
      order.paid_at = new Date();

      const updatedOrder = await this.ordersRepository.save(order);

      // 启动设备
      await this.startDevice(updatedOrder.id);

      this.logger.log(`余额支付成功: ${order.order_no}`, 'OrdersService');
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
      order.wechat_transaction_id = paymentResult.wechat_transaction_id;
      order.paid_at = new Date();

      const updatedOrder = await this.ordersRepository.save(order);

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

      if (!order.isPaid) {
        throw new BadRequestException('订单未支付');
      }

      // 更新订单状态为启动中
      order.status = OrderStatus.STARTING;
      await this.ordersRepository.save(order);

      // 调用设备服务启动设备
      const result = await this.devicesService.control(order.device_id, {
        command: 'start',
        duration_minutes: order.duration_minutes,
        parameters: order.device_params
      });

      if (result.success) {
        // 设备启动成功，更新订单状态
        order.status = OrderStatus.IN_USE;
        order.started_at = new Date();
        await this.ordersRepository.save(order);

        this.logger.log(`设备启动成功: ${order.order_no}`, 'OrdersService');
      } else {
        // 设备启动失败，退款
        await this.refund(orderId, '设备启动失败');
      }
    } catch (error) {
      this.logger.error(`启动设备失败: ${error.message}`, error.stack, 'OrdersService');
      // 启动失败，退款
      await this.refund(orderId, `设备启动失败: ${error.message}`);
      throw error;
    }
  }

  async finishOrder(orderId: number, actualDurationMinutes?: number): Promise<Order> {
    try {
      const order = await this.findOne(orderId);

      if (order.status !== OrderStatus.IN_USE) {
        throw new BadRequestException('订单状态不正确');
      }

      // 更新订单状态
      order.status = OrderStatus.SETTLING;
      order.finished_at = new Date();
      
      if (actualDurationMinutes) {
        order.actual_duration_minutes = actualDurationMinutes;
      }

      // 计算实际金额和分润
      const actualAmount = order.actualAmount;
      const merchantIncome = actualAmount * Number(order.commission_rate);
      const platformIncome = actualAmount - merchantIncome;

      order.merchant_income = merchantIncome;
      order.platform_income = platformIncome;

      const updatedOrder = await this.ordersRepository.save(order);

      // 更新商户收入
      await this.merchantsService.updateRevenue(order.merchant_id, actualAmount);

      // 更新设备使用统计
      await this.devicesService.updateUsageStats(
        order.device_id, 
        actualDurationMinutes || order.duration_minutes, 
        actualAmount
      );

      // 订单完成
      updatedOrder.status = OrderStatus.DONE;
      await this.ordersRepository.save(updatedOrder);

      this.logger.log(`订单完成: ${order.order_no}`, 'OrdersService');
      return updatedOrder;
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

      order.status = OrderStatus.CANCELLED;
      order.cancelled_at = new Date();
      order.cancel_reason = reason;

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
        throw new BadRequestException('订单无法退款');
      }

      const refundAmount = Number(order.paid_amount);

      // 退款到用户余额
      if (order.payment_method === PaymentMethod.BALANCE) {
        await this.usersService.updateBalance(order.user_id, refundAmount, 'add');
      }
      // TODO: 微信退款处理

      order.status = OrderStatus.REFUNDED;
      order.refunded_at = new Date();
      order.refund_amount = refundAmount;
      order.refund_reason = reason;

      const updatedOrder = await this.ordersRepository.save(order);

      this.logger.log(`订单退款成功: ${order.order_no}, 金额: ${refundAmount}`, 'OrdersService');
      return updatedOrder;
    } catch (error) {
      this.logger.error(`订单退款失败: ${error.message}`, error.stack, 'OrdersService');
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

  private generateOrderNo(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `LCH${timestamp}${random}`;
  }
}