import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device, DeviceStatus, DeviceWorkStatus } from '../entities/device.entity';
import { CreateDeviceDto, UpdateDeviceDto, DeviceStatusDto, DeviceControlDto, DeviceListDto } from '../dto/device.dto';
import { LoggerService } from '../../common/services/logger.service';
import { CacheService } from '../../common/services/cache.service';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private devicesRepository: Repository<Device>,
    private logger: LoggerService,
    private cacheService: CacheService,
  ) {}

  async create(createDeviceDto: CreateDeviceDto): Promise<Device> {
    try {
      // 检查设备ID是否已存在
      const existingDevice = await this.devicesRepository.findOne({
        where: { device_id: createDeviceDto.device_id }
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
      const { keyword, type, status, merchant_id, page = 1, limit = 20 } = query;
      const offset = (page - 1) * limit;

      const queryBuilder = this.devicesRepository.createQueryBuilder('device')
        .leftJoinAndSelect('device.merchant', 'merchant');

      // 关键字搜索
      if (keyword) {
        queryBuilder.where(
          '(device.name LIKE :keyword OR device.device_id LIKE :keyword OR device.location LIKE :keyword)',
          { keyword: `%${keyword}%` }
        );
      }

      // 设备类型筛选
      if (type) {
        queryBuilder.andWhere('device.type = :type', { type });
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
        where: { device_id: deviceId },
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
      device.work_status = deviceStatusDto.work_status;
      
      if (deviceStatusDto.water_level !== undefined) {
        device.water_level = deviceStatusDto.water_level;
      }
      
      if (deviceStatusDto.soap_level !== undefined) {
        device.soap_level = deviceStatusDto.soap_level;
      }

      if (deviceStatusDto.status === DeviceStatus.ONLINE) {
        device.last_online_at = new Date();
      }

      if (deviceStatusDto.status === DeviceStatus.ERROR) {
        device.last_error_at = new Date();
        if (deviceStatusDto.error_message) {
          device.last_error_message = deviceStatusDto.error_message;
        }
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

      // 根据命令执行不同操作
      switch (controlDto.command) {
        case 'start':
          if (device.work_status !== DeviceWorkStatus.IDLE) {
            throw new BadRequestException('设备非空闲状态，无法启动');
          }
          device.work_status = DeviceWorkStatus.WORKING;
          break;

        case 'stop':
          if (device.work_status === DeviceWorkStatus.IDLE) {
            throw new BadRequestException('设备已停止');
          }
          device.work_status = DeviceWorkStatus.IDLE;
          break;

        case 'pause':
          if (device.work_status !== DeviceWorkStatus.WORKING) {
            throw new BadRequestException('设备未在工作状态，无法暂停');
          }
          device.work_status = DeviceWorkStatus.PAUSED;
          break;

        case 'resume':
          if (device.work_status !== DeviceWorkStatus.PAUSED) {
            throw new BadRequestException('设备未暂停，无法恢复');
          }
          device.work_status = DeviceWorkStatus.WORKING;
          break;

        default:
          throw new BadRequestException('无效的控制命令');
      }

      await this.devicesRepository.save(device);

      // 清除缓存
      await this.cacheService.del(`device:${id}`);

      // TODO: 调用智链物联API发送控制指令
      // await this.iotService.sendCommand(device.device_id, controlDto);

      this.logger.log(`设备控制成功: ${id}, 命令: ${controlDto.command}`, 'DevicesService');
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
      
      device.total_usage_count += 1;
      device.total_usage_minutes += usageMinutes;
      device.total_revenue = Number(device.total_revenue) + revenue;

      await this.devicesRepository.save(device);

      // 清除缓存
      await this.cacheService.del(`device:${id}`);

      this.logger.log(`设备使用统计更新成功: ${id}, 时长: ${usageMinutes}分钟, 收入: ${revenue}元`, 'DevicesService');
    } catch (error) {
      this.logger.error(`设备使用统计更新失败: ${error.message}`, error.stack, 'DevicesService');
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    try {
      const device = await this.findOne(id);
      
      // 软删除 - 将状态设置为维护
      await this.devicesRepository.update(id, { status: DeviceStatus.MAINTENANCE });

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
          baseQuery.clone().andWhere('device.work_status = :workStatus', { workStatus: DeviceWorkStatus.WORKING }).getCount(),
          baseQuery.clone().andWhere('device.status = :status', { status: DeviceStatus.ERROR }).getCount(),
        ]);

        const totalRevenue = await baseQuery.clone()
          .select('SUM(device.total_revenue)', 'total')
          .getRawOne();

        const totalUsageMinutes = await baseQuery.clone()
          .select('SUM(device.total_usage_minutes)', 'total')
          .getRawOne();

        stats = {
          totalDevices,
          onlineDevices,
          workingDevices,
          errorDevices,
          offlineDevices: totalDevices - onlineDevices,
          totalRevenue: Number(totalRevenue?.total || 0),
          totalUsageMinutes: Number(totalUsageMinutes?.total || 0)
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
}