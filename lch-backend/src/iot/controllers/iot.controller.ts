import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IotService } from '../services/iot.service';
import { DevicesService } from '../../devices/services/devices.service';
import { OrdersService } from '../../orders/services/orders.service';
import { LoggerService } from '../../common/services/logger.service';

/**
 * IoT设备回调处理控制器
 * @author Lily
 * @description 处理智链物联设备状态上报、事件通知等回调
 */
@ApiTags('IoT设备回调')
@Controller('iot')
export class IotController {
  constructor(
    private readonly iotService: IotService,
    private readonly devicesService: DevicesService,
    private readonly ordersService: OrdersService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * 设备状态上报回调
   * 智链物联设备会定期或在状态变化时上报设备状态
   */
  @Post('device/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '设备状态上报回调' })
  @ApiResponse({ status: 200, description: '状态上报处理成功' })
  async handleDeviceStatusReport(@Body() reportData: any) {
    try {
      this.logger.log(`收到设备状态上报: ${JSON.stringify(reportData)}`, 'IotController');

      // 处理设备状态上报
      const statusReport = await this.iotService.handleDeviceReport(reportData);
      if (!statusReport) {
        return { code: 400, message: '状态数据格式错误或签名验证失败' };
      }

      // 同步设备状态到数据库
      await this.devicesService.syncDeviceStatusFromIot(statusReport.devid, statusReport);

      return { code: 0, message: '状态上报处理成功' };
    } catch (error) {
      this.logger.error(`处理设备状态上报失败: ${error.message}`, error.stack, 'IotController');
      return { code: 500, message: '内部服务器错误' };
    }
  }

  /**
   * 设备事件通知回调
   * 处理设备重要事件，如设备上线/下线、故障报警等
   */
  @Post('device/event')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '设备事件通知回调' })
  @ApiResponse({ status: 200, description: '事件通知处理成功' })
  async handleDeviceEvent(@Body() eventData: any) {
    try {
      this.logger.log(`收到设备事件通知: ${JSON.stringify(eventData)}`, 'IotController');

      const { devid, eventType, eventData: data, timestamp } = eventData;

      // 直接处理特殊事件
      switch (eventType) {
        case 'cmd09': // 洗车开始事件
          await this.handleWashStartEvent(devid, data);
          break;
          
        case 'cmd10': // 洗车完成事件
          await this.handleWashCompleteEvent(devid, data);
          break;
          
        case 'fault': // 设备故障事件
          await this.handleDeviceFaultEvent(devid, data);
          break;
      }

      return { code: 0, message: '事件处理成功' };
    } catch (error) {
      this.logger.error(`处理设备事件失败: ${error.message}`, error.stack, 'IotController');
      return { code: 500, message: '内部服务器错误' };
    }
  }

  /**
   * 处理洗车开始事件
   */
  private async handleWashStartEvent(devid: string, eventData: any) {
    try {
      this.logger.log(`处理洗车开始事件: ${devid}, 数据: ${JSON.stringify(eventData)}`, 'IotController');
      
      // 更新设备状态为工作中
      const statusReport = {
        devid,
        status: 'working',
        timestamp: Date.now(),
      };
      
      await this.devicesService.syncDeviceStatusFromIot(devid, statusReport as any);
      
      // TODO: 通知订单服务更新订单状态为使用中
      
    } catch (error) {
      this.logger.error(`处理洗车开始事件失败: ${devid}, ${error.message}`, error.stack, 'IotController');
    }
  }

  /**
   * 处理洗车完成事件
   */
  private async handleWashCompleteEvent(devid: string, eventData: any) {
    try {
      this.logger.log(`处理洗车完成事件: ${devid}, 数据: ${JSON.stringify(eventData)}`, 'IotController');
      
      // 调用订单服务完成当前订单
      const finishedOrder = await this.ordersService.finishOrderByDevice(devid, eventData.actualDuration);
      
      if (finishedOrder) {
        this.logger.log(`洗车完成事件处理成功: 订单 ${finishedOrder.order_no} 已完成`, 'IotController');
      } else {
        this.logger.warn(`洗车完成事件处理失败: 设备 ${devid} 没有活跃订单`, 'IotController');
      }
    } catch (error) {
      this.logger.error(`处理洗车完成事件失败: ${devid}, ${error.message}`, error.stack, 'IotController');
    }
  }

  /**
   * 处理设备故障事件
   */
  private async handleDeviceFaultEvent(devid: string, faultData: any) {
    try {
      // 更新设备状态为故障
      const statusReport = {
        devid,
        status: 'error',
        errorCode: faultData.errorCode,
        errorMessage: faultData.errorMessage,
        timestamp: Date.now(),
      };

      await this.devicesService.syncDeviceStatusFromIot(devid, statusReport as any);

      // TODO: 发送故障通知给相关人员
      // await this.notificationService.sendDeviceFaultAlert(devid, faultData);
      
      this.logger.warn(`设备故障处理完成: ${devid}`, 'IotController');
    } catch (error) {
      this.logger.error(`处理设备故障事件失败: ${devid}, ${error.message}`, error.stack, 'IotController');
    }
  }

  /**
   * 手动同步设备状态（调试用）
   */
  @Post('sync/devices')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '手动同步设备状态' })
  @ApiResponse({ status: 200, description: '同步完成' })
  async syncAllDevices(@Body() body: { merchantId?: number }) {
    try {
      const result = await this.devicesService.batchSyncDevicesFromIot(body.merchantId);
      return {
        code: 0,
        message: '同步完成',
        data: result,
      };
    } catch (error) {
      this.logger.error(`手动同步设备失败: ${error.message}`, error.stack, 'IotController');
      return {
        code: 500,
        message: '同步失败',
        error: error.message,
      };
    }
  }
}