import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Merchant } from '../../merchants/entities/merchant.entity';
import { Device } from '../../devices/entities/device.entity';

export enum OrderStatus {
  INIT = 'init',
  PAY_PENDING = 'pay_pending',
  PAID = 'paid',
  STARTING = 'starting',
  IN_USE = 'in_use',
  SETTLING = 'settling',
  DONE = 'done',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  WECHAT_PAY = 'wechat_pay',
  BALANCE = 'balance'
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 32 })
  order_no: string;

  @Column()
  user_id: number;

  @Column()
  merchant_id: number;

  @Column()
  device_id: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.INIT
  })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod
  })
  payment_method: PaymentMethod;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  paid_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  refund_amount: number;

  @Column({ type: 'int' })
  duration_minutes: number;

  @Column({ type: 'int', nullable: true })
  actual_duration_minutes: number;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  price_per_minute: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  commission_rate: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  merchant_income: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  platform_income: number;

  @Column({ length: 100, nullable: true })
  wechat_prepay_id: string;

  @Column({ length: 100, nullable: true })
  wechat_transaction_id: string;

  @Column({ nullable: true })
  paid_at: Date;

  @Column({ nullable: true })
  started_at: Date;

  @Column({ nullable: true })
  finished_at: Date;

  @Column({ nullable: true })
  cancelled_at: Date;

  @Column({ nullable: true })
  refunded_at: Date;

  @Column({ type: 'text', nullable: true })
  cancel_reason: string;

  @Column({ type: 'text', nullable: true })
  refund_reason: string;

  @Column({ type: 'json', nullable: true })
  device_params: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // 关联关系
  // @ManyToOne(() => User, user => user.orders)
  // @JoinColumn({ name: 'user_id' })
  // user: User;

  // @ManyToOne(() => Merchant, merchant => merchant.orders)
  // @JoinColumn({ name: 'merchant_id' })
  // merchant: Merchant;

  // @ManyToOne(() => Device, device => device.orders)
  // @JoinColumn({ name: 'device_id' })
  // device: Device;

  // 计算属性
  get isPaid(): boolean {
    return this.status === OrderStatus.PAID || 
           this.status === OrderStatus.STARTING || 
           this.status === OrderStatus.IN_USE ||
           this.status === OrderStatus.SETTLING ||
           this.status === OrderStatus.DONE;
  }

  get isActive(): boolean {
    return this.status === OrderStatus.STARTING || 
           this.status === OrderStatus.IN_USE;
  }

  get isFinished(): boolean {
    return this.status === OrderStatus.DONE || 
           this.status === OrderStatus.CANCELLED ||
           this.status === OrderStatus.REFUNDED;
  }

  get canCancel(): boolean {
    return this.status === OrderStatus.INIT || 
           this.status === OrderStatus.PAY_PENDING;
  }

  get canRefund(): boolean {
    return this.isPaid && !this.isFinished;
  }

  get needsSettlement(): boolean {
    return this.status === OrderStatus.SETTLING;
  }

  get actualAmount(): number {
    if (this.actual_duration_minutes) {
      return Number(this.price_per_minute) * this.actual_duration_minutes;
    }
    return Number(this.total_amount);
  }
}