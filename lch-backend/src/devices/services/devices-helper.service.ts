import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../entities/device.entity';
import { DeviceStatus } from '../../common/interfaces/common.interface';

@Injectable()
export class DevicesHelperService {
  private readonly logger = new Logger(DevicesHelperService.name);

  constructor(
    @InjectRepository(Device)
    private devicesRepository: Repository<Device>,
  ) {}

  /**
   * 释放设备 - 将设备状态设置为可用
   */
  async releaseDevice(deviceId: number): Promise<void> {
    try {
      await this.devicesRepository.update(deviceId, {
        status: DeviceStatus.ONLINE,
        updated_at: new Date()
      });

      this.logger.log(`设备释放成功: ${deviceId}`);
    } catch (error) {
      this.logger.error(`设备释放失败: ${deviceId}`, error);
      throw error;
    }
  }

  /**
   * 占用设备 - 将设备状态设置为使用中
   */
  async occupyDevice(deviceId: number): Promise<void> {
    try {
      await this.devicesRepository.update(deviceId, {
        status: DeviceStatus.WASHING,
        updated_at: new Date()
      });

      this.logger.log(`设备占用成功: ${deviceId}`);
    } catch (error) {
      this.logger.error(`设备占用失败: ${deviceId}`, error);
      throw error;
    }
  }

  /**
   * 设置设备故障状态
   */
  async setDeviceError(deviceId: number, errorMessage?: string): Promise<void> {
    try {
      await this.devicesRepository.update(deviceId, {
        status: DeviceStatus.ERROR,
        updated_at: new Date()
      });

      this.logger.warn(`设备故障: ${deviceId}, 错误信息: ${errorMessage}`);
    } catch (error) {
      this.logger.error(`设置设备故障状态失败: ${deviceId}`, error);
      throw error;
    }
  }
}