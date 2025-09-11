import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CouponsService } from '../services/coupons.service';
import { Coupon } from '../entities/coupon.entity';
import { UserCouponStatus } from '../entities/user-coupon.entity';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // 获取所有优惠券
  @Get()
  findAll() {
    return this.couponsService.findAll();
  }

  // 获取活跃的优惠券
  @Get('active')
  findActive() {
    return this.couponsService.findActive();
  }

  // 获取优惠券统计
  @Get('statistics')
  getStatistics() {
    return this.couponsService.getStatistics();
  }

  // 获取单个优惠券
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(+id);
  }

  // 创建优惠券
  @Post()
  create(@Body() createCouponDto: Partial<Coupon>) {
    return this.couponsService.create(createCouponDto);
  }

  // 更新优惠券
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCouponDto: Partial<Coupon>) {
    return this.couponsService.update(+id, updateCouponDto);
  }

  // 删除优惠券
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.couponsService.remove(+id);
  }

  // 用户领取优惠券
  @Post(':id/claim')
  claimCoupon(@Param('id') id: string, @Body('userId') userId: number) {
    return this.couponsService.claimCoupon(userId, +id);
  }

  // 获取用户优惠券
  @Get('user/:userId')
  getUserCoupons(
    @Param('userId') userId: string,
    @Query('status') status?: UserCouponStatus
  ) {
    return this.couponsService.getUserCoupons(+userId, status);
  }

  // 使用优惠券
  @Post('user-coupon/:id/use')
  useCoupon(@Param('id') id: string, @Body('orderId') orderId: number) {
    return this.couponsService.useCoupon(+id, orderId);
  }
}