import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

export enum CouponType {
  DISCOUNT = 'discount',
  AMOUNT = 'amount',
  FREE_MINUTES = 'free_minutes'
}

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, comment: '优惠券名称' })
  name: string;

  @Column({ type: 'text', nullable: true, comment: '优惠券描述' })
  description: string;

  @Column({
    type: 'enum',
    enum: CouponType,
    default: CouponType.AMOUNT,
    comment: '优惠券类型'
  })
  type: CouponType;

  @Column({ type: 'decimal', precision: 10, scale: 2, comment: '优惠值(金额或折扣)' })
  value: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '最低消费金额' })
  min_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, comment: '最大优惠金额' })
  max_discount_amount: number;

  @Column({ type: 'int', comment: '发行总量' })
  total_quantity: number;

  @Column({ type: 'int', comment: '剩余数量' })
  remaining_quantity: number;

  @Column({ comment: '生效时间' })
  start_date: Date;

  @Column({ comment: '失效时间' })
  end_date: Date;

  @Column({ type: 'boolean', default: true, comment: '是否启用' })
  is_active: boolean;

  @CreateDateColumn({ comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updated_at: Date;

  // 计算属性
  get isValid(): boolean {
    const now = new Date();
    return this.is_active && now >= this.start_date && now <= this.end_date;
  }

  get isAvailable(): boolean {
    return this.isValid && this.remaining_quantity > 0;
  }
}