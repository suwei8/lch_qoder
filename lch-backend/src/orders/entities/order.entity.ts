import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Merchant } from '../../merchants/entities/merchant.entity';
import { Device } from '../../devices/entities/device.entity';
import { OrderStatus, PaymentMethod } from '../../common/interfaces/common.interface';

/**
 * 订单实体
 * @author Lily
 * @description 洗车IOT系统订单管理，支持完整的订单状态机流转
 */

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 32, comment: '订单号' })
  order_no: string;

  @Column({ comment: '用户ID' })
  user_id: number;

  @Column({ comment: '商户ID' })
  merchant_id: number;

  @Column({ comment: '设备ID' })
  device_id: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.INIT,
    comment: '订单状态'
  })
  status: OrderStatus;

  @Column({ type: 'int', unsigned: true, comment: '订单金额(分)' })
  amount: number;

  @Column({ type: 'int', unsigned: true, default: 0, comment: '实际支付金额(分)' })
  paid_amount: number;

  @Column({ type: 'int', unsigned: true, default: 0, comment: '退款金额(分)' })
  refund_amount: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
    comment: '支付方式'
  })
  payment_method: PaymentMethod;

  @Column({ type: 'int', unsigned: true, default: 0, comment: '使用余额(分)' })
  balance_used: number;

  @Column({ type: 'int', unsigned: true, default: 0, comment: '使用赠送余额(分)' })
  gift_balance_used: number;

  @Column({ type: 'int', unsigned: true, default: 0, comment: '优惠金额(分)' })
  discount_amount: number;

  @Column({ length: 64, nullable: true, comment: '优惠券ID' })
  coupon_id: string;

  @Column({ length: 128, nullable: true, comment: '微信预支付单ID' })
  wechat_prepay_id: string;

  @Column({ length: 128, nullable: true, comment: '微信交易号' })
  wechat_transaction_id: string;

  @Column({ type: 'json', nullable: true, comment: '支付相关信息' })
  payment_info: any;

  @Column({ type: 'timestamp', nullable: true, comment: '支付时间' })
  paid_at: Date;

  @Column({ type: 'timestamp', nullable: true, comment: '开始使用时间' })
  start_at: Date;

  @Column({ type: 'timestamp', nullable: true, comment: '结束使用时间' })
  end_at: Date;

  @Column({ type: 'int', unsigned: true, nullable: true, comment: '使用时长(分钟)' })
  duration_minutes: number;

  @Column({ type: 'json', nullable: true, comment: '设备上报的原始数据' })
  device_data: any;

  @Column({ length: 255, nullable: true, comment: '备注' })
  remark: string;

  @Column({ type: 'timestamp', nullable: true, comment: '过期时间' })
  expire_at: Date;

  @CreateDateColumn({ comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updated_at: Date;

  // 关联关系
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'merchant_id' })
  merchant: Merchant;

  @ManyToOne(() => Device)
  @JoinColumn({ name: 'device_id' })
  device: Device;

  // 订单状态机业务方法
  /**
   * 判断订单是否已支付
   */
  get isPaid(): boolean {
    return [
      OrderStatus.PAID,
      OrderStatus.STARTING,
      OrderStatus.IN_USE,
      OrderStatus.SETTLING,
      OrderStatus.DONE
    ].includes(this.status);
  }

  /**
   * 判断订单是否正在使用中
   */
  get isActive(): boolean {
    return [
      OrderStatus.STARTING,
      OrderStatus.IN_USE
    ].includes(this.status);
  }

  /**
   * 判断订单是否已结束
   */
  get isFinished(): boolean {
    return [
      OrderStatus.DONE,
      OrderStatus.CLOSED
    ].includes(this.status);
  }

  /**
   * 判断订单是否可以取消
   */
  get canCancel(): boolean {
    return [
      OrderStatus.INIT,
      OrderStatus.PAY_PENDING
    ].includes(this.status);
  }

  /**
   * 判断订单是否可以退款
   */
  get canRefund(): boolean {
    return this.isPaid && !this.isFinished;
  }

  /**
   * 判断订单是否需要结算
   */
  get needsSettlement(): boolean {
    return this.status === OrderStatus.SETTLING;
  }

  /**
   * 判断订单是否超时
   */
  get isExpired(): boolean {
    if (!this.expire_at) return false;
    return new Date() > this.expire_at;
  }

  /**
   * 状态机流转方法
   */
  transitionTo(newStatus: OrderStatus): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.INIT]: [OrderStatus.PAY_PENDING, OrderStatus.CANCELLED, OrderStatus.CLOSED],
      [OrderStatus.PAY_PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED, OrderStatus.CLOSED],
      [OrderStatus.PAID]: [OrderStatus.STARTING, OrderStatus.REFUNDING],
      [OrderStatus.STARTING]: [OrderStatus.IN_USE, OrderStatus.REFUNDING],
      [OrderStatus.IN_USE]: [OrderStatus.SETTLING],
      [OrderStatus.SETTLING]: [OrderStatus.DONE],
      [OrderStatus.REFUNDING]: [OrderStatus.CLOSED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.DONE]: [],
      [OrderStatus.CLOSED]: []
    };

    const allowedTransitions = validTransitions[this.status] || [];
    if (allowedTransitions.includes(newStatus)) {
      this.status = newStatus;
      return true;
    }
    return false;
  }
}