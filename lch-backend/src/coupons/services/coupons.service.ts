import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon, CouponType } from '../entities/coupon.entity';
import { UserCoupon, UserCouponStatus } from '../entities/user-coupon.entity';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    @InjectRepository(UserCoupon)
    private userCouponRepository: Repository<UserCoupon>,
  ) {}

  // 获取所有优惠券
  async findAll(): Promise<Coupon[]> {
    return this.couponRepository.find({
      order: { created_at: 'DESC' }
    });
  }

  // 获取活跃的优惠券
  async findActive(): Promise<Coupon[]> {
    const now = new Date();
    return this.couponRepository.find({
      where: {
        is_active: true,
      },
      order: { created_at: 'DESC' }
    });
  }

  // 根据ID获取优惠券
  async findOne(id: number): Promise<Coupon> {
    return this.couponRepository.findOne({ where: { id } });
  }

  // 创建优惠券
  async create(couponData: Partial<Coupon>): Promise<Coupon> {
    const coupon = this.couponRepository.create(couponData);
    return this.couponRepository.save(coupon);
  }

  // 更新优惠券
  async update(id: number, couponData: Partial<Coupon>): Promise<Coupon> {
    await this.couponRepository.update(id, couponData);
    return this.findOne(id);
  }

  // 删除优惠券
  async remove(id: number): Promise<void> {
    await this.couponRepository.delete(id);
  }

  // 用户领取优惠券
  async claimCoupon(userId: number, couponId: number): Promise<UserCoupon> {
    const coupon = await this.findOne(couponId);
    if (!coupon || !coupon.isAvailable) {
      throw new Error('优惠券不可用');
    }

    // 检查用户是否已经领取过
    const existingUserCoupon = await this.userCouponRepository.findOne({
      where: { user_id: userId, coupon_id: couponId }
    });

    if (existingUserCoupon) {
      throw new Error('您已经领取过该优惠券');
    }

    // 减少剩余数量
    await this.couponRepository.update(couponId, {
      remaining_quantity: coupon.remaining_quantity - 1
    });

    // 创建用户优惠券记录
    const userCoupon = this.userCouponRepository.create({
      user_id: userId,
      coupon_id: couponId,
      expire_at: coupon.end_date,
      received_at: new Date()
    });

    return this.userCouponRepository.save(userCoupon);
  }

  // 获取用户的优惠券
  async getUserCoupons(userId: number, status?: UserCouponStatus): Promise<UserCoupon[]> {
    const where: any = { user_id: userId };
    if (status) {
      where.status = status;
    }

    return this.userCouponRepository.find({
      where,
      relations: ['coupon'],
      order: { created_at: 'DESC' }
    });
  }

  // 使用优惠券
  async useCoupon(userCouponId: number, orderId: number): Promise<UserCoupon> {
    const userCoupon = await this.userCouponRepository.findOne({
      where: { id: userCouponId }
    });

    if (!userCoupon || !userCoupon.canUse) {
      throw new Error('优惠券不可用');
    }

    userCoupon.status = UserCouponStatus.USED;
    userCoupon.used_at = new Date();
    userCoupon.order_id = orderId;

    return this.userCouponRepository.save(userCoupon);
  }

  // 优惠券统计
  async getStatistics(): Promise<any> {
    const [totalCoupons, activeCoupons, totalClaimed, totalUsed] = await Promise.all([
      this.couponRepository.count(),
      this.couponRepository.count({ where: { is_active: true } }),
      this.userCouponRepository.count(),
      this.userCouponRepository.count({ where: { status: UserCouponStatus.USED } })
    ]);

    return {
      totalCoupons,
      activeCoupons,
      totalClaimed,
      totalUsed,
      usageRate: totalClaimed > 0 ? (totalUsed / totalClaimed * 100).toFixed(2) : 0
    };
  }
}