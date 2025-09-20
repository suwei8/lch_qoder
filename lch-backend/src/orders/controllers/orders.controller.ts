import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from '../services/orders.service';
import { CreateOrderDto, UpdateOrderDto, PaymentResultDto, OrderListDto } from '../dto/order.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/interfaces/common.interface';
import { User } from '../../users/entities/user.entity';
import { MerchantsService } from '../../merchants/services/merchants.service';

@ApiTags('订单管理')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly merchantsService: MerchantsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建订单' })
  @ApiResponse({ status: 201, description: '订单创建成功' })
  async create(@Body() createOrderDto: CreateOrderDto, @CurrentUser() user: User) {
    // 用户只能为自己创建订单
    createOrderDto.user_id = user.id;
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取订单列表' })
  @ApiResponse({ status: 200, description: '订单列表获取成功' })
  async findAll(@Query() query: OrderListDto, @CurrentUser() user: User) {
    // 根据用户角色过滤数据
    if (user.role === UserRole.USER) {
      query.user_id = user.id;
    } else if (user.role === UserRole.MERCHANT) {
      const merchant = await this.merchantsService.findByUserId(user.id);
      if (merchant) {
        query.merchant_id = merchant.id;
      }
    }
    
    return this.ordersService.findAll(query);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取订单统计信息' })
  @ApiResponse({ status: 200, description: '订单统计获取成功' })
  async getStats(@CurrentUser() user: User) {
    let merchantId: number | undefined;
    let userId: number | undefined;
    
    if (user.role === UserRole.USER) {
      userId = user.id;
    } else if (user.role === UserRole.MERCHANT) {
      const merchant = await this.merchantsService.findByUserId(user.id);
      merchantId = merchant?.id;
    }
    
    return this.ordersService.getStats(merchantId, userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取指定订单信息' })
  @ApiResponse({ status: 200, description: '订单信息获取成功' })
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新订单信息' })
  @ApiResponse({ status: 200, description: '订单信息更新成功' })
  async update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(+id, updateOrderDto);
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '启动设备' })
  @ApiResponse({ status: 200, description: '设备启动成功' })
  async startDevice(@Param('id') id: string) {
    return this.ordersService.startDevice(+id);
  }

  @Post(':id/finish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.MERCHANT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '完成订单' })
  @ApiResponse({ status: 200, description: '订单完成成功' })
  async finish(
    @Param('id') id: string,
    @Body() body: { actual_duration_minutes?: number }
  ) {
    return this.ordersService.finishOrder(+id, body.actual_duration_minutes);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '取消订单' })
  @ApiResponse({ status: 200, description: '订单取消成功' })
  async cancel(
    @Param('id') id: string,
    @Body() body: { reason: string }
  ) {
    return this.ordersService.cancel(+id, body.reason);
  }

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '订单退款' })
  @ApiResponse({ status: 200, description: '退款成功' })
  async refund(
    @Param('id') id: string,
    @Body() body: { reason: string }
  ) {
    return this.ordersService.refund(+id, body.reason);
  }

  @Post('payment/wechat/callback')
  @ApiOperation({ summary: '微信支付回调' })
  @ApiResponse({ status: 200, description: '支付回调处理成功' })
  async wechatPaymentCallback(@Body() paymentResult: PaymentResultDto) {
    return this.ordersService.processWechatPayment(paymentResult);
  }
}