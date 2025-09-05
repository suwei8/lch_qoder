import { Controller, Post, Body, Headers, HttpCode, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WechatPaymentService, WechatPaymentParams } from '../services/wechat-payment.service';
import { OrdersService } from '../../orders/services/orders.service';
import { LoggerService } from '../../common/services/logger.service';
import { PaymentMethod, OrderStatus } from '../../common/interfaces/common.interface';

class CreateWechatPaymentDto {
  orderNo: string;
  openid: string;
}

class WechatPaymentNotifyDto {
  id: string;
  create_time: string;
  resource_type: string;
  event_type: string;
  summary: string;
  resource: {
    original_type: string;
    algorithm: string;
    ciphertext: string;
    associated_data: string;
    nonce: string;
  };
}

/**
 * 微信支付控制器
 * 处理微信JSAPI支付、回调、查询等功能
 */
@ApiTags('微信支付')
@Controller('payments/wechat')
export class WechatPaymentController {
  constructor(
    private readonly wechatPaymentService: WechatPaymentService,
    private readonly ordersService: OrdersService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * 创建微信JSAPI支付
   */
  @Post('jsapi')
  @ApiOperation({ summary: '创建微信JSAPI支付' })
  @ApiResponse({ status: 200, description: '支付参数创建成功' })
  async createJSAPIPayment(@Body() createPaymentDto: CreateWechatPaymentDto) {
    try {
      // 1. 查询订单信息
      const order = await this.ordersService.findByOrderNo(createPaymentDto.orderNo);
      if (!order) {
        return {
          code: 40404,
          message: '订单不存在'
        };
      }

      // 2. 验证订单状态
      if (order.status !== OrderStatus.PAY_PENDING) {
        return {
          code: 40001,
          message: `订单状态不正确，当前状态: ${order.status}`
        };
      }

      // 3. 检查订单是否过期
      if (order.isExpired) {
        return {
          code: 40001,
          message: '订单已过期'
        };
      }

      // 4. 验证支付方式
      if (order.payment_method !== PaymentMethod.WECHAT) {
        // 更新订单支付方式为微信支付
        await this.ordersService.update(order.id, { 
          payment_method: PaymentMethod.WECHAT 
        });
      }

      // 5. 准备支付参数
      const paymentParams: WechatPaymentParams = {
        orderNo: order.order_no,
        amount: order.amount,
        description: `亮车惠洗车服务-${order.device?.name || '设备'}`,
        openid: createPaymentDto.openid,
        notifyUrl: `${process.env.API_BASE_URL || 'http://localhost:5603'}/api/payments/wechat/notify`,
        timeExpire: order.expire_at
      };

      // 6. 创建微信支付
      const paymentResult = await this.wechatPaymentService.createJSAPIPayment(paymentParams);

      // 7. 保存预支付单ID到订单
      await this.ordersService.update(order.id, {
        wechat_prepay_id: paymentResult.prepayId
      });

      this.logger.log(
        `微信JSAPI支付创建成功: ${order.order_no}, prepayId: ${paymentResult.prepayId}`,
        'WechatPaymentController'
      );

      return {
        code: 0,
        message: '支付参数创建成功',
        data: {
          orderNo: order.order_no,
          amount: order.amount,
          paymentParams: paymentResult.paymentParams
        }
      };
    } catch (error) {
      this.logger.error(`创建微信支付失败: ${error.message}`, error.stack, 'WechatPaymentController');
      return {
        code: 50003,
        message: '创建支付失败，请稍后重试'
      };
    }
  }

  /**
   * 微信支付结果通知
   */
  @Post('notify')
  @HttpCode(200)
  @ApiOperation({ summary: '微信支付结果通知' })
  @ApiResponse({ status: 200, description: '通知处理成功' })
  async paymentNotify(
    @Headers('wechatpay-signature') signature: string,
    @Headers('wechatpay-timestamp') timestamp: string,
    @Headers('wechatpay-nonce') nonce: string,
    @Body() notifyData: WechatPaymentNotifyDto
  ) {
    try {
      this.logger.log(`收到微信支付通知: ${notifyData.id}`, 'WechatPaymentController');

      // 1. 验证签名
      const body = JSON.stringify(notifyData);
      const isValidSignature = this.wechatPaymentService.verifyNotifySignature(
        signature,
        timestamp,
        nonce,
        body
      );

      if (!isValidSignature) {
        this.logger.warn(`微信支付通知签名验证失败: ${notifyData.id}`, 'WechatPaymentController');
        return { code: 'FAIL', message: '签名验证失败' };
      }

      // 2. 解密资源数据（在生产环境中需要实现）
      // const decryptedData = this.decryptNotifyResource(notifyData.resource);
      
      // 模拟解密后的支付结果数据
      const paymentResult = {
        out_trade_no: `LCH${Date.now()}001`, // 应该从解密数据中获取
        transaction_id: `wx_transaction_${Date.now()}`,
        trade_state: 'SUCCESS',
        amount: {
          total: 1000,
          payer_total: 1000
        },
        success_time: new Date().toISOString()
      };

      // 3. 处理支付成功通知
      if (paymentResult.trade_state === 'SUCCESS') {
        await this.handlePaymentSuccess(paymentResult);
      }

      return { code: 'SUCCESS', message: 'OK' };
    } catch (error) {
      this.logger.error(`处理微信支付通知失败: ${error.message}`, error.stack, 'WechatPaymentController');
      return { code: 'FAIL', message: '处理失败' };
    }
  }

  /**
   * 查询支付状态
   */
  @Get('status/:orderNo')
  @ApiOperation({ summary: '查询微信支付状态' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async queryPaymentStatus(@Param('orderNo') orderNo: string) {
    try {
      const paymentStatus = await this.wechatPaymentService.queryPaymentStatus(orderNo);
      
      return {
        code: 0,
        message: '查询成功',
        data: paymentStatus
      };
    } catch (error) {
      this.logger.error(`查询微信支付状态失败: ${orderNo}, ${error.message}`, error.stack, 'WechatPaymentController');
      return {
        code: 50003,
        message: '查询失败'
      };
    }
  }

  /**
   * 手动同步支付状态
   */
  @Post('sync/:orderNo')
  @ApiOperation({ summary: '手动同步微信支付状态' })
  @ApiResponse({ status: 200, description: '同步成功' })
  async syncPaymentStatus(@Param('orderNo') orderNo: string) {
    try {
      // 1. 查询订单
      const order = await this.ordersService.findByOrderNo(orderNo);
      if (!order) {
        return {
          code: 40404,
          message: '订单不存在'
        };
      }

      // 2. 查询微信支付状态
      const paymentStatus = await this.wechatPaymentService.queryPaymentStatus(orderNo);
      
      // 3. 同步订单状态
      if (paymentStatus.status === 'SUCCESS' && order.status === OrderStatus.PAY_PENDING) {
        await this.ordersService.processWechatPayment({
          order_no: orderNo,
          wechat_transaction_id: paymentStatus.transactionId,
          paid_amount: paymentStatus.amount,
          payment_info: paymentStatus
        });

        this.logger.log(`手动同步支付状态成功: ${orderNo}`, 'WechatPaymentController');
      }

      return {
        code: 0,
        message: '同步成功',
        data: {
          orderStatus: order.status,
          paymentStatus: paymentStatus.status
        }
      };
    } catch (error) {
      this.logger.error(`同步微信支付状态失败: ${orderNo}, ${error.message}`, error.stack, 'WechatPaymentController');
      return {
        code: 50003,
        message: '同步失败'
      };
    }
  }

  /**
   * 处理支付成功
   */
  private async handlePaymentSuccess(paymentResult: any): Promise<void> {
    try {
      const orderNo = paymentResult.out_trade_no;
      
      // 查询订单
      const order = await this.ordersService.findByOrderNo(orderNo);
      if (!order) {
        this.logger.warn(`支付成功但订单不存在: ${orderNo}`, 'WechatPaymentController');
        return;
      }

      // 检查订单状态
      if (order.status !== OrderStatus.PAY_PENDING) {
        this.logger.warn(`订单状态不是待支付: ${orderNo}, 当前状态: ${order.status}`, 'WechatPaymentController');
        return;
      }

      // 处理支付成功
      await this.ordersService.processWechatPayment({
        order_no: orderNo,
        wechat_transaction_id: paymentResult.transaction_id,
        paid_amount: paymentResult.amount.payer_total,
        payment_info: paymentResult
      });

      this.logger.log(`微信支付成功处理完成: ${orderNo}`, 'WechatPaymentController');
    } catch (error) {
      this.logger.error(
        `处理支付成功失败: ${paymentResult.out_trade_no}, ${error.message}`,
        error.stack,
        'WechatPaymentController'
      );
    }
  }

  /**
   * 申请微信退款
   */
  @Post('refund')
  @ApiOperation({ summary: '申请微信退款' })
  @ApiResponse({ status: 200, description: '退款申请成功' })
  async createRefund(@Body() refundData: {
    orderNo: string;
    refundNo: string;
    totalAmount: number;
    refundAmount: number;
    reason?: string;
  }) {
    try {
      // 1. 查询订单
      const order = await this.ordersService.findByOrderNo(refundData.orderNo);
      if (!order) {
        return {
          code: 40404,
          message: '订单不存在'
        };
      }

      // 2. 验证订单状态
      if (order.payment_method !== 'wechat') {
        return {
          code: 40001,
          message: '非微信支付订单'
        };
      }

      // 3. 申请微信退款
      const refundParams = {
        outTradeNo: refundData.orderNo,
        outRefundNo: refundData.refundNo,
        totalAmount: refundData.totalAmount,
        refundAmount: refundData.refundAmount,
        reason: refundData.reason || '用户申请退款'
      };

      const refundResult = await this.wechatPaymentService.createRefund(refundParams);

      this.logger.log(`微信退款申请成功: ${refundData.orderNo}, 退款ID: ${refundResult.refundId}`, 'WechatPaymentController');

      return {
        code: 0,
        message: '退款申请成功',
        data: {
          refundId: refundResult.refundId,
          status: refundResult.status
        }
      };
    } catch (error) {
      this.logger.error(`申请微信退款失败: ${refundData.orderNo}, ${error.message}`, error.stack, 'WechatPaymentController');
      return {
        code: 50003,
        message: '退款申请失败'
      };
    }
  }

  /**
   * 微信退款结果通知
   */
  @Post('refund/notify')
  @HttpCode(200)
  @ApiOperation({ summary: '微信退款结果通知' })
  @ApiResponse({ status: 200, description: '退款通知处理成功' })
  async refundNotify(
    @Headers('wechatpay-signature') signature: string,
    @Headers('wechatpay-timestamp') timestamp: string,
    @Headers('wechatpay-nonce') nonce: string,
    @Body() notifyData: any
  ) {
    try {
      this.logger.log(`收到微信退款通知: ${notifyData.id}`, 'WechatPaymentController');

      // 1. 验证签名
      const body = JSON.stringify(notifyData);
      const isValidSignature = this.wechatPaymentService.verifyNotifySignature(
        signature,
        timestamp,
        nonce,
        body
      );

      if (!isValidSignature) {
        this.logger.warn(`微信退款通知签名验证失败: ${notifyData.id}`, 'WechatPaymentController');
        return { code: 'FAIL', message: '签名验证失败' };
      }

      // 2. 解密资源数据（模拟）
      const refundResult = {
        out_trade_no: `LCH${Date.now()}001`, // 应该从解密数据中获取
        out_refund_no: `refund_${Date.now()}`,
        refund_id: `wx_refund_${Date.now()}`,
        refund_status: 'SUCCESS',
        amount: {
          total: 1000,
          refund: 1000,
          payer_total: 1000,
          payer_refund: 1000
        },
        success_time: new Date().toISOString()
      };

      // 3. 处理退款成功通知
      if (refundResult.refund_status === 'SUCCESS') {
        await this.handleRefundSuccess(refundResult);
      }

      return { code: 'SUCCESS', message: 'OK' };
    } catch (error) {
      this.logger.error(`处理微信退款通知失败: ${error.message}`, error.stack, 'WechatPaymentController');
      return { code: 'FAIL', message: '处理失败' };
    }
  }

  /**
   * 查询退款状态
   */
  @Get('refund/status/:refundNo')
  @ApiOperation({ summary: '查询微信退款状态' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async queryRefundStatus(@Param('refundNo') refundNo: string) {
    try {
      const refundStatus = await this.wechatPaymentService.queryRefundStatus(refundNo);
      
      return {
        code: 0,
        message: '查询成功',
        data: refundStatus
      };
    } catch (error) {
      this.logger.error(`查询微信退款状态失败: ${refundNo}, ${error.message}`, error.stack, 'WechatPaymentController');
      return {
        code: 50003,
        message: '查询失败'
      };
    }
  }

  /**
   * 处理退款成功
   */
  private async handleRefundSuccess(refundResult: any): Promise<void> {
    try {
      const orderNo = refundResult.out_trade_no;
      
      // 查询订单
      const order = await this.ordersService.findByOrderNo(orderNo);
      if (!order) {
        this.logger.warn(`退款成功但订单不存在: ${orderNo}`, 'WechatPaymentController');
        return;
      }

      // 更新订单退款状态
      await this.ordersService.update(order.id, {
        status: OrderStatus.CLOSED,
        refund_amount: refundResult.amount.payer_refund,
        wechat_transaction_id: refundResult.refund_id
      });

      this.logger.log(`微信退款成功处理完成: ${orderNo}`, 'WechatPaymentController');
    } catch (error) {
      this.logger.error(
        `处理退款成功失败: ${refundResult.out_trade_no}, ${error.message}`,
        error.stack,
        'WechatPaymentController'
      );
    }
  }

  /**
   * 解密通知资源（生产环境实现）
   */
  private decryptNotifyResource(resource: any): any {
    // 这里应该实现微信支付通知的解密逻辑
    // 使用平台证书私钥解密resource中的ciphertext
    // 参考微信支付官方文档的解密算法
    throw new Error('通知解密功能未实现');
  }
}