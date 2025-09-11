import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Coupon } from './coupon.entity';

export enum UserCouponStatus {
  UNUSED = 'unused',
  USED = 'used',
  EXPIRED = 'expired'
}

@Entity('user_coupons')
export class UserCoupon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ comment: '用户ID' })
  user_id: number;

  @Column({ comment: '优惠券ID' })
  coupon_id: number;

  @Column({
    type: 'enum',
    enum: UserCouponStatus,
    default: UserCouponStatus.UNUSED,
    comment: '使用状态'
  })
  status: UserCouponStatus;

  @Column({ default: () => 'CURRENT_TIMESTAMP', comment: '领取时间' })
  received_at: Date;

  @Column({ nullable: true, comment: '使用时间' })
  used_at: Date;

  @Column({ nullable: true, comment: '关联订单ID' })
  order_id: number;

  @Column({ comment: '过期时间' })
  expire_at: Date;

  @CreateDateColumn({ comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updated_at: Date;

  // 关联关系
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Coupon)
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon;

  // 计算属性
  get isExpired(): boolean {
    return new Date() > this.expire_at;
  }

  get canUse(): boolean {
    return this.status === UserCouponStatus.UNUSED && !this.isExpired;
  }
}