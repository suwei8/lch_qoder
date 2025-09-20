import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../entities/device.entity';
import { DeviceStatus } from '../../common/interfaces/common.interface';
import { CreateDeviceDto, UpdateDeviceDto, DeviceStatusDto, DeviceControlDto, DeviceListDto } from '../dto/device.dto';
import { LoggerService } from '../../common/services/logger.service';
import { CacheService } from '../../common/services/cache.service';
import { IotService, IotCommandType, IotControlParams, DeviceStatusReport } from '../../iot/services/iot.service';
import { NotificationService } from '../../notification/services/notification.service';
import { NotificationChannel } from '../../notification/interfaces/notification.interface';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private devicesRepository: Repository<Device>,
    private logger: LoggerService,
    private cacheService: CacheService,
    private iotService: IotService,
    private notificationService: NotificationService,
  ) {}

  async create(createDeviceDto: CreateDeviceDto): Promise<Device> {
    try {
      // 检查设备ID是否已存在
      const existingDevice = await this.devicesRepository.findOne({
        where: { devid: createDeviceDto.devid }
      });

      if (existingDevice) {
        throw new ConflictException('设备ID已存在');
      }

      const device = this.devicesRepository.create(createDeviceDto);
      const savedDevice = await this.devicesRepository.save(device);

      // 清除缓存
      await this.cacheService.del('devices:list:*');
      
      this.logger.log(`设备创建成功: ${savedDevice.id}`, 'DevicesService');
      return savedDevice;
    } catch (error) {
      this.logger.error(`设备创建失败: ${error.message}`, error.stack, 'DevicesService');
      throw error;
    }
  }

  async findAll(query: DeviceListDto) {
    try {
      const { keyword, status, merchant_id, page = 1, limit = 20 } = query;
      const offset = (page - 1) * limit;

      const queryBuilder = this.devicesRepository.createQueryBuilder('device')
        .leftJoinAndSelect('device.merchant', 'merchant');

      // 关键字搜索
      if (keyword) {
        queryBuilder.where(
          '(device.name LIKE :keyword OR device.devid LIKE :keyword OR device.location LIKE :keyword)',
          { keyword: `%${keyword}%` }
        );
      }



      // 状态筛选
      if (status) {
        queryBuilder.andWhere('device.status = :status', { status });
      }

      // 商户筛选
      if (merchant_id) {
        queryBuilder.andWhere('device.merchant_id = :merchant_id', { merchant_id });
      }

      // 分页
      queryBuilder
        .orderBy('device.created_at', 'DESC')
        .skip(offset)
        .take(limit);

      const [devices, total] = await queryBuilder.getManyAndCount();

      return {
        data: devices,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      this.logger.error(`设备列表查询失败: ${error.message}`, error.stack, 'DevicesService');
      throw error;
    }
  }

  async findOne(id: number): Promise<Device> {
    try {
      // 先尝试从缓存获取
      const cacheKey = `device:${id}`;
      let device = await this.cacheService.get(cacheKey);

      if (!device) {
        device = await this.devicesRepository.findOne({
          where: { id },
          relations: ['merchant', 'orders']
        });

        if (!device) {
          throw new NotFoundException('设备不存在');
        }

        // 缓存设备信息（5分钟）
        await this.cacheService.set(cacheKey, device, 300);
      }

      return device;
    } catch (error) {
      this.logger.error(`设备查询失败: ${error.message}`, error.stack, 'DevicesService');
      throw error;
    }
  }

  async findByDeviceId(deviceId: string): Promise<Device | null> {
    try {
      return await this.devicesRepository.findOne({
        where: { devid: deviceId },
        relations: ['merchant']
      });
    } catch (error) {
      this.logger.error(`通过设备ID查询设备失败: ${error.message}`, error.stack, 'DevicesService');
      throw error;
    }
  }

  async findByMerchant(merchantId: number): Promise<Device[]> {
    try {
      return await this.devicesRepository.find({
        where: { merchant_id: merchantId },
        order: { created_at: 'DESC' }
      });
    } catch (error) {
      this.logger.error(`查询商户设备失败: ${error.message}`, error.stack, 'DevicesService');
      throw error;
    }
  }

  async update(id: number, updateDeviceDto: UpdateDeviceDto): Promise<Device> {
    try {
      const device = await this.findOne(id);
      
      Object.assign(device, updateDeviceDto);
      const updatedDevice = await this.devicesRepository.save(device);

      // 清除缓存
      await this.cacheService.del(`device:${id}`);
      await this.cacheService.del('devices:list:*');

      this.logger.log(`设备更新成功: ${id}`, 'DevicesService');
      return updatedDevice;
    } catch (error) {
      this.logger.error(`设备更新失败: ${error.message}`, error.stack, 'DevicesService');
      throw error;
    }
  }

  async updateStatus(id: number, deviceStatusDto: DeviceStatusDto): Promise<Device> {
    try {
      const device = await this.findOne(id);
      
      device.status = deviceStatusDto.status;
      // work_status字段暂不更新，等待后续业务需求
      
      // 设备状态参数更新（暂时跳过，等待后续业务需求）

      if (deviceStatusDto.status === DeviceStatus.ONLINE) {
        device.last_seen_at = new Date();
      }

      if (deviceStatusDto.status === DeviceStatus.ERROR) {
        // 错误信息记录（暂时跳过，等待后续业务需求）
      }

      const updatedDevice = await this.devicesRepository.save(device);

      // 清除缓存
      await this.cacheService.del(`device:${id}`);

      this.logger.log(`设备状态更新成功: ${id}, 状态: ${deviceStatusDto.status}`, 'DevicesService');
      return updatedDevice;
    } catch (error) {
      this.logger.error(`设备状态更新失败: ${error.message}`, error.stack, 'DevicesService');
      throw error;
    }
  }

  async control(id: number, controlDto: DeviceControlDto): Promise<{ success: boolean; message: string }> {
    try {
      const device = await this.findOne(id);

      // 检查设备状态
      if (!device.isOnline) {
        throw new BadRequestException('设备离线，无法执行操作');
      }

      // 准备IoT控制参数
      const iotParams: IotControlParams = {
        duration: controlDto.duration_minutes,
        ...controlDto.parameters
      };

      let iotCommand: IotCommandType;
      let newDeviceStatus: DeviceStatus = device.status;

      // 根据命令执行不同操作
      switch (controlDto.command) {
        case 'start':
          if (device.status !== DeviceStatus.ONLINE) {
            throw new BadRequestException(`设备非在线状态，无法启动，当前状态: ${device.status}`);
          }
          iotCommand = IotCommandType.START;
          newDeviceStatus = 'busy' as any; // 设备忙碌状态
          break;

        case 'stop':
          if (!device.isBusy) {
            throw new BadRequestException('设备未在工作状态，无法停止');
          }
          iotCommand = IotCommandType.STOP;
          newDeviceStatus = DeviceStatus.ONLINE; // 停止后恢复在线状态
          break;

        case 'pause':
          if (!device.isBusy) {
            throw new BadRequestException('设备未在工作状态，无法暂停');
          }
          iotCommand = IotCommandType.PAUSE;
          // 暂停不改变状态
          break;

        case 'resume':
          if (!device.isBusy) {
            throw new BadRequestException('设备未在暂停状态，无法恢复');
          }
          iotCommand = IotCommandType.RESUME;
          // 恢复不改变状态
          break;

        default:
          throw new BadRequestException('无效的控制命令');
      }

      // 调用智链物联API发送控制指令
      const iotResult = await this.iotService.sendCommand(device.devid, iotCommand, iotParams);
      
      if (!iotResult.success) {
        throw new BadRequestException(`设备控制失败: ${iotResult.message}`);
      }

      // 更新设备状态
      if (newDeviceStatus !== device.status) {
        device.status = newDeviceStatus;
        device.last_seen_at = new Date(); // 更新最后在线时间
        await this.devicesRepository.save(device);
      }

      // 清除缓存
      await this.cacheService.del(`device:${id}`);

      this.logger.log(
        `设备控制成功: ${id}(${device.devid}), 命令: ${controlDto.command}, ` +
        `状态变更: ${device.status} -> ${newDeviceStatus}`,
        'DevicesService'
      );
      
      return {
        success: true,
        message: `设备${controlDto.command}命令执行成功`
      };
    } catch (error) {
      this.logger.error(`设备控制失败: ${error.message}`, error.stack, 'DevicesService');
      throw error;
    }
  }

  async updateUsageStats(id: number, usageMinutes: number, revenue: number): Promise<void> {
    try {
      const device = await this.findOne(id);
      
      device.total_orders += 1;
      // total_usage_minutes字段不存在，使用total_revenue记录
      device.total_revenue = Number(device.total_revenue) + revenue;
      device.last_order_at = new Date();

      await this.devicesRepository.save(device);

      // 清除缓存
      await this.cacheService.del(`device:${id}`);

      this.logger.log(`设备使用统计更新成功: ${id}, 时长: ${usageMinutes}分钟, 收入: ${(revenue/100).toFixed(2)}元`, 'DevicesService');
    } catch (error) {
      this.logger.error(`设备使用统计更新失败: ${error.message}`, error.stack, 'DevicesService');
      throw error;
    }
  }

  /**
   * 同步设备状态（来自IoT设备上报）
   */
  async syncDeviceStatusFromIot(devid: string, statusReport: DeviceStatusReport): Promise<void> {
    try {
      const device = await this.devicesRepository.findOne({ where: { devid } });
      if (!device) {
        this.logger.warn(`收到未知设备状态上报: ${devid}`, 'DevicesService');
        return;
      }

      const oldStatus = device.status;
      let newStatus = this.mapIotStatusToDevice(statusReport.status);

      // 更新设备信息
      device.status = newStatus;
      device.last_seen_at = new Date(statusReport.timestamp);
      
      if (statusReport.signal !== undefined) {
        device.signal_strength = statusReport.signal.toString();
      }
      
      if (statusReport.errorCode || statusReport.errorMessage) {
        device.status = DeviceStatus.ERROR;
        this.logger.warn(
          `设备报告错误: ${devid}, 错误代码: ${statusReport.errorCode}, 错误信息: ${statusReport.errorMessage}`,
          'DevicesService'
        );
        
        // 发送设备故障告警通知
        this.sendDeviceAlarmNotification(device, 'fault', statusReport.errorMessage || '设备故障');
      }

      await this.devicesRepository.save(device);

      // 清除缓存
      await this.cacheService.del(`device:${device.id}`);

      if (oldStatus !== device.status) {
        this.logger.log(
          `设备状态同步: ${devid}(${device.id}), ${oldStatus} -> ${device.status}`,
          'DevicesService'
        );
        
        // 检查设备状态变化，发送告警通知
        if (device.status === DeviceStatus.OFFLINE && oldStatus === DeviceStatus.ONLINE) {
          // 设备离线告警
          this.sendDeviceAlarmNotification(device, 'offline', '设备离线');
        } else if (device.status === DeviceStatus.ERROR && oldStatus !== DeviceStatus.ERROR) {
          // 设备故障告警
          this.sendDeviceAlarmNotification(device, 'fault', '设备出现故障');
        }
      }
    } catch (error) {
      this.logger.error(`同步设备状态失败: ${devid}, ${error.message}`, error.stack, 'DevicesService');
    }
  }

  /**
   * 批量查询设备状态（从智链物联）
   */
  async batchSyncDevicesFromIot(merchantId?: number): Promise<{ synced: number; failed: number }> {
    try {
      // 获取要同步的设备列表
      const whereClause = merchantId ? { merchant_id: merchantId, is_active: true } : { is_active: true };
      const devices = await this.devicesRepository.find({ where: whereClause });
      
      if (devices.length === 0) {
        return { synced: 0, failed: 0 };
      }

      const devids = devices.map(device => device.devid);
      const statusMap = await this.iotService.batchQueryDeviceStatus(devids);
      
      let synced = 0;
      let failed = 0;

      for (const device of devices) {
        try {
          const statusReport = statusMap.get(device.devid);
          if (statusReport) {
            await this.syncDeviceStatusFromIot(device.devid, statusReport);
            synced++;
          } else {
            failed++;
          }
        } catch (error) {
          this.logger.error(`同步设备失败: ${device.devid}, ${error.message}`, null, 'DevicesService');
          failed++;
        }
      }

      this.logger.log(`批量同步设备状态完成: 成功 ${synced}个, 失败 ${failed}个`, 'DevicesService');
      return { synced, failed };
    } catch (error) {
      this.logger.error(`批量同步设备状态失败: ${error.message}`, error.stack, 'DevicesService');
      return { synced: 0, failed: 0 };
    }
  }

  /**
   * 发送设备告警通知
   */
  private async sendDeviceAlarmNotification(
    device: Device, 
    alarmType: 'offline' | 'fault' | 'alarm', 
    errorMessage: string
  ): Promise<void> {
    try {
      // 获取商户信息
      if (!device.merchant && device.merchant_id) {
        const merchant = await this.devicesRepository
          .createQueryBuilder('device')
          .leftJoinAndSelect('device.merchant', 'merchant')
          .where('device.id = :id', { id: device.id })
          .getOne();
        device.merchant = merchant?.merchant;
      }

      if (!device.merchant) {
        this.logger.warn(`设备告警通知无法发送，未找到商户信息: ${device.devid}`, 'DevicesService');
        return;
      }

      // 构建接收者列表（商户和管理员）
      const recipients = [];
      
      // 添加商户接收者
      if (device.merchant.wechat_openid || device.merchant.mobile) {
        recipients.push({
          userId: device.merchant.id,
          openid: device.merchant.wechat_openid,
          phone: device.merchant.mobile,
          name: device.merchant.name
        });
      }

      // TODO: 添加平台管理员接收者（暂时留空）
      // 可以从配置文件或数据库中获取管理员联系方式

      if (recipients.length === 0) {
        this.logger.warn(`设备告警通知无收件人: ${device.devid}`, 'DevicesService');
        return;
      }

      // 发送告警通知
      await this.notificationService.sendDeviceAlertNotification(
        device.id,
        alarmType,
        `设备 ${device.name} (${device.location || '未知位置'}) 发生告警: ${errorMessage}`
      );

      this.logger.log(
        `设备告警通知已发送: ${device.devid}, 类型: ${alarmType}, 接收者: ${recipients.length}人`,
        'DevicesService'
      );
    } catch (error) {
      this.logger.error(
        `发送设备告警通知失败: ${device.devid}, ${error.message}`,
        error.stack,
        'DevicesService'
      );
    }
  }

  /**
   * 映射IoT状态到设备状态
   */
  private mapIotStatusToDevice(iotStatus: string): DeviceStatus {
    switch (iotStatus?.toLowerCase()) {
      case 'online':
        return DeviceStatus.ONLINE;
      case 'working':
      case 'busy':
        return 'busy' as any; // 返回忙碌状态
      case 'error':
      case 'fault':
        return DeviceStatus.ERROR;
      case 'offline':
      default:
        return DeviceStatus.OFFLINE;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const device = await this.findOne(id);
      
      // 软删除 - 将设备设置为不活跃
      await this.devicesRepository.update(id, { is_active: false });

      // 清除缓存
      await this.cacheService.del(`device:${id}`);
      await this.cacheService.del('devices:list:*');

      this.logger.log(`设备删除成功: ${id}`, 'DevicesService');
    } catch (error) {
      this.logger.error(`设备删除失败: ${error.message}`, error.stack, 'DevicesService');
      throw error;
    }
  }

  async getStats(merchantId?: number) {
    try {
      const cacheKey = merchantId ? `devices:stats:merchant:${merchantId}` : 'devices:stats:all';
      let stats = await this.cacheService.get(cacheKey);

      if (!stats) {
        const baseQuery = this.devicesRepository.createQueryBuilder('device');
        
        if (merchantId) {
          baseQuery.where('device.merchant_id = :merchantId', { merchantId });
        }

        const [
          totalDevices,
          onlineDevices,
          workingDevices,
          errorDevices
        ] = await Promise.all([
          baseQuery.getCount(),
          baseQuery.clone().andWhere('device.status = :status', { status: DeviceStatus.ONLINE }).getCount(),
          baseQuery.clone().andWhere('device.status = :status', { status: 'busy' }).getCount(),
          baseQuery.clone().andWhere('device.status = :status', { status: DeviceStatus.ERROR }).getCount(),
        ]);

        const totalRevenue = await baseQuery.clone()
          .select('SUM(device.total_revenue)', 'total')
          .getRawOne();

        const totalOrders = await baseQuery.clone()
          .select('SUM(device.total_orders)', 'total')
          .getRawOne();

        stats = {
          totalDevices,
          onlineDevices,
          workingDevices,
          errorDevices,
          offlineDevices: totalDevices - onlineDevices,
          totalRevenue: Number(totalRevenue?.total || 0),
          totalOrders: Number(totalOrders?.total || 0)
        };

        // 缓存10分钟
        await this.cacheService.set(cacheKey, stats, 600);
      }

      return stats;
    } catch (error) {
      this.logger.error(`获取设备统计失败: ${error.message}`, error.stack, 'DevicesService');
      throw error;
    }
  }

  async getNearbyDevices(latitude: number, longitude: number, radius: number = 5): Promise<Device[]> {
    try {
      // 使用Haversine公式计算距离（简化版）
      const query = `
        SELECT *,
        (6371 * acos(
          cos(radians(?)) * cos(radians(latitude)) * 
          cos(radians(longitude) - radians(?)) + 
          sin(radians(?)) * sin(radians(latitude))
        )) AS distance
        FROM devices
        WHERE status = '${DeviceStatus.ONLINE}'
        HAVING distance < ?
        ORDER BY distance
        LIMIT 50
      `;

      const devices = await this.devicesRepository.query(query, [latitude, longitude, latitude, radius]);
      
      return devices;
    } catch (error) {
      this.logger.error(`查询附近设备失败: ${error.message}`, error.stack, 'DevicesService');
      throw error;
    }
  }

  /**
   * 释放设备 (OrdersService需要)
   */
  async releaseDevice(deviceId: number): Promise<void> {
    try {
      const device = await this.devicesRepository.findOne({ where: { id: deviceId } });
      if (!device) {
        throw new NotFoundException('设备不存在');
      }

      // 更新设备状态为在线可用
      await this.devicesRepository.update(deviceId, {
        status: DeviceStatus.ONLINE
      });

      // 清除缓存
      await this.cacheService.del(`device:${deviceId}`);
      await this.cacheService.del('devices:list:*');

      this.logger.log(`设备释放成功: ${deviceId}`, 'DevicesService');
    } catch (error) {
      this.logger.error(`设备释放失败: ${deviceId}, ${error.message}`, error.stack, 'DevicesService');
      throw error;
    }
  }
}