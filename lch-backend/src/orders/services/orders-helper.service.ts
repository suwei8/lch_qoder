import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderStatus } from '../../common/interfaces/common.interface';
import { NotificationSimpleService } from '../../notification/services/notification-simple.service';

@Injectable()
export class OrdersHelperService {
  private readonly logger = new Logger(OrdersHelperService.name);

  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private notificationService: NotificationSimpleService,
  ) {}

  /**
   * 取消订单
   */
  async cancelOrder(orderId: number, cancelData: {
    reason: string;
    operator_id?: number;
    operator_type: 'user' | 'admin' | 'system';
  }): Promise<Order> {
    try {
      const order = await this.ordersRepository.findOne({
        where: { id: orderId },
        relations: ['user', 'device']
      });

      if (!order) {
        throw new NotFoundException('订单不存在');
      }

      // 检查订单状态是否可以取消
      const cancellableStatuses = [
        OrderStatus.INIT,
        OrderStatus.PAY_PENDING,
        OrderStatus.PAID
      ];

      if (!cancellableStatuses.includes(order.status)) {
        throw new BadRequestException(`订单状态为${order.status}，无法取消`);
      }

      // 更新订单状态
      await this.ordersRepository.update(orderId, {
        status: OrderStatus.CANCELLED,
        remark: cancelData.reason,
        updated_at: new Date()
      });

      // 发送通知
      await this.notificationService.sendToUser(order.user_id, {
        title: '订单已取消',
        content: `您的订单 ${order.order_no} 已取消，原因：${cancelData.reason}`,
        type: 'order_cancelled'
      });

      const updatedOrder = await this.ordersRepository.findOne({
        where: { id: orderId },
        relations: ['user', 'device']
      });

      this.logger.log(`订单取消成功: ${order.order_no}, 操作者: ${cancelData.operator_type}`);
      
      return updatedOrder;
    } catch (error) {
      this.logger.error(`取消订单失败: ${orderId}`, error);
      throw error;
    }
  }

  /**
   * 退款订单
   */
  async refundOrder(orderId: number, refundData: {
    reason: string;
    amount?: number;
    operator_id?: number;
    operator_type: 'user' | 'admin' | 'system';
  }): Promise<Order> {
    try {
      const order = await this.ordersRepository.findOne({
        where: { id: orderId },
        relations: ['user', 'device']
      });

      if (!order) {
        throw new NotFoundException('订单不存在');
      }

      // 检查订单是否可以退款
      if (order.paid_amount <= 0) {
        throw new BadRequestException('订单未支付，无法退款');
      }

      // 计算退款金额
      const maxRefundAmount = order.paid_amount - (order.refund_amount || 0);
      const refundAmount = refundData.amount ? 
        Math.min(refundData.amount, maxRefundAmount) : maxRefundAmount;

      if (refundAmount <= 0) {
        throw new BadRequestException('退款金额必须大于0');
      }

      // 更新订单退款信息
      await this.ordersRepository.update(orderId, {
        refund_amount: (order.refund_amount || 0) + refundAmount,
        status: refundAmount >= maxRefundAmount ? OrderStatus.CANCELLED : order.status,
        remark: `${order.remark || ''} | 退款: ${refundData.reason}`,
        updated_at: new Date()
      });

      // 发送通知
      await this.notificationService.sendToUser(order.user_id, {
        title: '订单已退款',
        content: `您的订单 ${order.order_no} 已退款 ¥${(refundAmount / 100).toFixed(2)}，原因：${refundData.reason}`,
        type: 'order_refunded'
      });

      const updatedOrder = await this.ordersRepository.findOne({
        where: { id: orderId },
        relations: ['user', 'device']
      });

      this.logger.log(`订单退款成功: ${order.order_no}, 退款金额: ${refundAmount}分`);
      
      return updatedOrder;
    } catch (error) {
      this.logger.error(`订单退款失败: ${orderId}`, error);
      throw error;
    }
  }
}