import { Controller, Post, Get, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../common/interfaces/common.interface';
import { NotificationService } from '../services/notification.service';
import { 
  NotificationChannel, 
  NotificationType, 
  NotificationRecipient,
  BatchNotificationResult
} from '../interfaces/notification.interface';

/**
 * 发送通知请求DTO
 */
class SendNotificationDto {
  type: NotificationType;
  channel: NotificationChannel;
  recipient: NotificationRecipient;
  data?: Record<string, any>;
  url?: string;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * 批量发送通知请求DTO
 */
class BatchSendNotificationDto {
  notifications: Array<{
    type: NotificationType;
    channel: NotificationChannel;
    recipient: NotificationRecipient;
    data?: Record<string, any>;
    url?: string;
  }>;
  options?: {
    fallback?: boolean;
    priority?: 'low' | 'normal' | 'high';
    delay?: number;
  };
}

/**
 * 订单支付通知DTO
 */
class OrderPaidNotificationDto {
  recipient: NotificationRecipient;
  orderNo: string;
  amount: number;
  deviceName: string;
  enableSms?: boolean;
}

/**
 * 订单完成通知DTO
 */
class OrderCompleteNotificationDto {
  recipient: NotificationRecipient;
  orderNo: string;
  amount: number;
  duration: number;
  enableSms?: boolean;
}

/**
 * 订单退款通知DTO
 */
class OrderRefundNotificationDto {
  recipient: NotificationRecipient;
  orderNo: string;
  refundAmount: number;
  reason: string;
  enableSms?: boolean;
}

/**
 * 设备告警通知DTO
 */
class DeviceAlarmNotificationDto {
  recipients: NotificationRecipient[];
  deviceName: string;
  location: string;
  errorMessage: string;
  alarmType: 'offline' | 'fault' | 'alarm';
}

/**
 * 商户结算通知DTO
 */
class MerchantSettleNotificationDto {
  recipient: NotificationRecipient;
  settlePeriod: string;
  amount: number;
  account: string;
  enableSms?: boolean;
}

/**
 * 测试通知DTO
 */
class TestNotificationDto {
  type: NotificationType;
  channel: NotificationChannel;
  recipient: NotificationRecipient;
}

/**
 * 通知服务控制器
 * @author Lily
 * @description 提供通知发送的RESTful API接口，支持微信模板消息、短信等多种渠道
 */
@ApiTags('通知服务')
@Controller('notification')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * 发送通用通知
   */
  @Post('send')
  @ApiOperation({ summary: '发送通用通知' })
  @ApiResponse({ status: 200, description: '通知发送成功' })
  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  @HttpCode(HttpStatus.OK)
  async sendNotification(@Body() sendDto: SendNotificationDto) {
    const notificationData = {
      type: sendDto.type,
      channel: sendDto.channel,
      recipient: sendDto.recipient,
      data: sendDto.data,
      url: sendDto.url,
      priority: sendDto.priority,
    };

    const result = await this.notificationService.sendNotification(notificationData, {
      channels: [sendDto.channel],
      fallback: false,
      priority: sendDto.priority,
    });

    return {
      success: result.success > 0,
      message: result.success > 0 ? '通知发送成功' : '通知发送失败',
      data: result,
    };
  }

  /**
   * 批量发送通知
   */
  @Post('batch-send')
  @ApiOperation({ summary: '批量发送通知' })
  @ApiResponse({ status: 200, description: '批量通知发送完成' })
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async batchSendNotifications(@Body() batchDto: BatchSendNotificationDto) {
    const notifications = batchDto.notifications.map(notification => ({
      data: {
        type: notification.type,
        channel: notification.channel,
        recipient: notification.recipient,
        data: notification.data,
        url: notification.url,
      },
      options: {
        channels: [notification.channel],
        fallback: batchDto.options?.fallback || false,
        priority: batchDto.options?.priority || 'normal',
        delay: batchDto.options?.delay || 0,
      }
    }));

    const results = await this.notificationService.batchSendNotifications(notifications);

    const totalStats = results.reduce(
      (acc, result) => ({
        total: acc.total + result.total,
        success: acc.success + result.success,
        failed: acc.failed + result.failed,
      }),
      { total: 0, success: 0, failed: 0 }
    );

    return {
      success: totalStats.success > 0,
      message: `批量通知发送完成，成功${totalStats.success}条，失败${totalStats.failed}条`,
      data: {
        summary: totalStats,
        details: results,
      },
    };
  }

  /**
   * 发送订单支付成功通知
   */
  @Post('order/paid')
  @ApiOperation({ summary: '发送订单支付成功通知' })
  @ApiResponse({ status: 200, description: '订单支付通知发送成功' })
  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  @HttpCode(HttpStatus.OK)
  async sendOrderPaidNotification(@Body() orderDto: OrderPaidNotificationDto) {
    const result = await this.notificationService.sendOrderPaidNotification(
      orderDto.recipient,
      {
        orderNo: orderDto.orderNo,
        amount: orderDto.amount,
        deviceName: orderDto.deviceName,
      },
      {
        channels: orderDto.enableSms 
          ? [NotificationChannel.WECHAT_TEMPLATE, NotificationChannel.SMS]
          : [NotificationChannel.WECHAT_TEMPLATE],
        fallback: !orderDto.enableSms,
      }
    );

    return {
      success: result.success > 0,
      message: result.success > 0 ? '订单支付通知发送成功' : '订单支付通知发送失败',
      data: result,
    };
  }

  /**
   * 发送订单完成通知
   */
  @Post('order/complete')
  @ApiOperation({ summary: '发送订单完成通知' })
  @ApiResponse({ status: 200, description: '订单完成通知发送成功' })
  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  @HttpCode(HttpStatus.OK)
  async sendOrderCompleteNotification(@Body() orderDto: OrderCompleteNotificationDto) {
    const result = await this.notificationService.sendOrderCompleteNotification(
      orderDto.recipient,
      {
        orderNo: orderDto.orderNo,
        amount: orderDto.amount,
        duration: orderDto.duration,
      },
      {
        channels: orderDto.enableSms 
          ? [NotificationChannel.WECHAT_TEMPLATE, NotificationChannel.SMS]
          : [NotificationChannel.WECHAT_TEMPLATE],
        fallback: !orderDto.enableSms,
      }
    );

    return {
      success: result.success > 0,
      message: result.success > 0 ? '订单完成通知发送成功' : '订单完成通知发送失败',
      data: result,
    };
  }

  /**
   * 发送订单退款通知
   */
  @Post('order/refund')
  @ApiOperation({ summary: '发送订单退款通知' })
  @ApiResponse({ status: 200, description: '订单退款通知发送成功' })
  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  @HttpCode(HttpStatus.OK)
  async sendOrderRefundNotification(@Body() refundDto: OrderRefundNotificationDto) {
    const result = await this.notificationService.sendOrderRefundNotification(
      refundDto.recipient,
      {
        orderNo: refundDto.orderNo,
        refundAmount: refundDto.refundAmount,
        reason: refundDto.reason,
      },
      {
        channels: refundDto.enableSms 
          ? [NotificationChannel.WECHAT_TEMPLATE, NotificationChannel.SMS]
          : [NotificationChannel.WECHAT_TEMPLATE],
        fallback: !refundDto.enableSms,
      }
    );

    return {
      success: result.success > 0,
      message: result.success > 0 ? '订单退款通知发送成功' : '订单退款通知发送失败',
      data: result,
    };
  }

  /**
   * 发送设备告警通知
   */
  @Post('device/alarm')
  @ApiOperation({ summary: '发送设备告警通知' })
  @ApiResponse({ status: 200, description: '设备告警通知发送成功' })
  @Roles(UserRole.ADMIN, UserRole.MERCHANT)
  @HttpCode(HttpStatus.OK)
  async sendDeviceAlarmNotification(@Body() alarmDto: DeviceAlarmNotificationDto) {
    const results = await this.notificationService.sendDeviceAlarmNotification(
      alarmDto.recipients,
      {
        deviceName: alarmDto.deviceName,
        location: alarmDto.location,
        errorMessage: alarmDto.errorMessage,
        alarmType: alarmDto.alarmType,
      },
      {
        priority: 'high',
      }
    );

    const totalStats = results.reduce(
      (acc, result) => ({
        total: acc.total + result.total,
        success: acc.success + result.success,
        failed: acc.failed + result.failed,
      }),
      { total: 0, success: 0, failed: 0 }
    );

    return {
      success: totalStats.success > 0,
      message: totalStats.success > 0 ? '设备告警通知发送成功' : '设备告警通知发送失败',
      data: {
        summary: totalStats,
        details: results,
      },
    };
  }

  /**
   * 发送商户结算通知
   */
  @Post('merchant/settle')
  @ApiOperation({ summary: '发送商户结算通知' })
  @ApiResponse({ status: 200, description: '商户结算通知发送成功' })
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async sendMerchantSettleNotification(@Body() settleDto: MerchantSettleNotificationDto) {
    const result = await this.notificationService.sendMerchantSettleNotification(
      settleDto.recipient,
      {
        settlePeriod: settleDto.settlePeriod,
        amount: settleDto.amount,
        account: settleDto.account,
      },
      {
        channels: settleDto.enableSms 
          ? [NotificationChannel.WECHAT_TEMPLATE, NotificationChannel.SMS]
          : [NotificationChannel.WECHAT_TEMPLATE],
        fallback: !settleDto.enableSms,
      }
    );

    return {
      success: result.success > 0,
      message: result.success > 0 ? '商户结算通知发送成功' : '商户结算通知发送失败',
      data: result,
    };
  }

  /**
   * 测试通知发送（仅开发环境）
   */
  @Post('test')
  @ApiOperation({ summary: '测试通知发送（仅开发环境）' })
  @ApiResponse({ status: 200, description: '测试通知发送成功' })
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async testNotification(@Body() testDto: TestNotificationDto) {
    const result = await this.notificationService.testNotification(
      testDto.type,
      testDto.channel,
      testDto.recipient
    );

    return {
      success: result.success,
      message: result.success ? '测试通知发送成功' : `测试通知发送失败: ${result.error}`,
      data: result,
    };
  }

  /**
   * 获取通知发送统计
   */
  @Get('stats')
  @ApiOperation({ summary: '获取通知发送统计' })
  @ApiResponse({ status: 200, description: '获取统计数据成功' })
  @Roles(UserRole.ADMIN)
  async getNotificationStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const stats = await this.notificationService.getNotificationStats(start, end);

    return {
      success: true,
      message: '获取通知统计成功',
      data: stats,
    };
  }
}