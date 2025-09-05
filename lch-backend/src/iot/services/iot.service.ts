import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { LoggerService } from '../../common/services/logger.service';
import { firstValueFrom } from 'rxjs';
import { createHash, createHmac } from 'crypto';
import { DeviceStatus } from '../../common/interfaces/common.interface';

/**
 * 智链物联设备状态枚举
 */
export enum IotDeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline', 
  WORKING = 'working',
  ERROR = 'error',
}

/**
 * 智链物联命令类型
 */
export enum IotCommandType {
  START = 'start',      // 启动设备
  STOP = 'stop',        // 停止设备
  PAUSE = 'pause',      // 暂停设备
  RESUME = 'resume',    // 恢复设备
  QUERY = 'query',      // 查询状态
}

/**
 * 设备控制参数接口
 */
export interface IotControlParams {
  duration?: number;     // 运行时长(分钟)
  pressure?: number;     // 水压等级 1-5
  temperature?: number;  // 水温等级 1-3
  mode?: string;        // 工作模式
}

/**
 * 智链物联API响应接口
 */
export interface IotApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  timestamp: number;
}

/**
 * 设备状态上报数据接口
 */
export interface DeviceStatusReport {
  devid: string;
  status: IotDeviceStatus;
  signal?: number;        // 信号强度 0-100
  battery?: number;       // 电池电量 0-100  
  temperature?: number;   // 设备温度
  pressure?: number;      // 当前水压
  workTime?: number;      // 累计工作时长(分钟)
  errorCode?: string;     // 错误代码
  errorMessage?: string;  // 错误描述
  location?: {           // GPS位置
    latitude: number;
    longitude: number;
  };
  timestamp: number;
}

/**
 * 智链物联IoT服务
 * @author Lily  
 * @description 集成智链物联设备控制API，提供设备命令发送、状态查询、数据上报处理等功能
 */
@Injectable()
export class IotService {
  private readonly apiUrl: string;
  private readonly appKey: string;
  private readonly appSecret: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.apiUrl = this.configService.get<string>('IOT_API_URL') || 'https://api.zhilian.com';
    this.appKey = this.configService.get<string>('IOT_APP_KEY') || '';
    this.appSecret = this.configService.get<string>('IOT_APP_SECRET') || '';

    if (!this.appKey || !this.appSecret) {
      this.logger.warn('智链物联API配置缺失，设备控制将使用模拟模式', 'IotService');
    }
  }

  /**
   * 发送设备控制命令
   */
  async sendCommand(
    devid: string, 
    command: IotCommandType, 
    params?: IotControlParams
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      if (!this.appKey || !this.appSecret) {
        // 模拟模式
        return this.simulateCommand(devid, command, params);
      }

      const requestData = {
        devid,
        command,
        params: params || {},
        timestamp: Date.now(),
      };

      const response = await this.makeApiRequest('/device/control', requestData);
      
      if (response.code === 0) {
        this.logger.log(`设备命令发送成功: ${devid}, 命令: ${command}`, 'IotService');
        return {
          success: true,
          message: response.message || '命令发送成功',
          data: response.data,
        };
      } else {
        this.logger.error(`设备命令发送失败: ${devid}, 错误: ${response.message}`, null, 'IotService');
        return {
          success: false,
          message: response.message || '命令发送失败',
        };
      }
    } catch (error) {
      this.logger.error(`设备命令发送异常: ${devid}, ${error.message}`, error.stack, 'IotService');
      return {
        success: false,
        message: `命令发送异常: ${error.message}`,
      };
    }
  }

  /**
   * 查询设备状态
   */
  async queryDeviceStatus(devid: string): Promise<DeviceStatusReport | null> {
    try {
      if (!this.appKey || !this.appSecret) {
        // 模拟模式
        return this.simulateDeviceStatus(devid);
      }

      const requestData = {
        devid,
        timestamp: Date.now(),
      };

      const response = await this.makeApiRequest('/device/status', requestData);
      
      if (response.code === 0 && response.data) {
        this.logger.log(`设备状态查询成功: ${devid}`, 'IotService');
        return response.data as DeviceStatusReport;
      } else {
        this.logger.warn(`设备状态查询失败: ${devid}, 错误: ${response.message}`, 'IotService');
        return null;
      }
    } catch (error) {
      this.logger.error(`设备状态查询异常: ${devid}, ${error.message}`, error.stack, 'IotService');
      return null;
    }
  }

  /**
   * 批量查询设备状态
   */
  async batchQueryDeviceStatus(devids: string[]): Promise<Map<string, DeviceStatusReport>> {
    try {
      const statusMap = new Map<string, DeviceStatusReport>();
      
      // 并发查询，但限制并发数量
      const batchSize = 10;
      for (let i = 0; i < devids.length; i += batchSize) {
        const batch = devids.slice(i, i + batchSize);
        const promises = batch.map(devid => this.queryDeviceStatus(devid));
        const results = await Promise.allSettled(promises);
        
        results.forEach((result, index) => {
          const devid = batch[index];
          if (result.status === 'fulfilled' && result.value) {
            statusMap.set(devid, result.value);
          }
        });
      }
      
      this.logger.log(`批量查询设备状态完成: ${devids.length}个设备, ${statusMap.size}个成功`, 'IotService');
      return statusMap;
    } catch (error) {
      this.logger.error(`批量查询设备状态异常: ${error.message}`, error.stack, 'IotService');
      return new Map();
    }
  }

  /**
   * 处理设备状态上报
   */
  async handleDeviceReport(reportData: any): Promise<DeviceStatusReport | null> {
    try {
      // 验证上报数据签名
      if (this.appSecret && !this.verifyReportSignature(reportData)) {
        this.logger.warn(`设备状态上报签名验证失败: ${reportData.devid}`, 'IotService');
        return null;
      }

      // 数据格式验证和转换
      const statusReport: DeviceStatusReport = {
        devid: reportData.devid,
        status: this.mapIotStatusToSystem(reportData.status),
        signal: reportData.signal,
        battery: reportData.battery,
        temperature: reportData.temperature,
        pressure: reportData.pressure,
        workTime: reportData.workTime,
        errorCode: reportData.errorCode,
        errorMessage: reportData.errorMessage,
        location: reportData.location,
        timestamp: reportData.timestamp || Date.now(),
      };

      this.logger.log(`设备状态上报处理成功: ${statusReport.devid}, 状态: ${statusReport.status}`, 'IotService');
      return statusReport;
    } catch (error) {
      this.logger.error(`处理设备状态上报异常: ${error.message}`, error.stack, 'IotService');
      return null;
    }
  }

  /**
   * 智链物联HTTP客户端封装
   */
  private async makeApiRequest(endpoint: string, data: any, retries = 3): Promise<IotApiResponse> {
    const url = `${this.apiUrl}${endpoint}`;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        // 生成请求签名
        const signature = this.generateSignature(data);
        const headers = {
          'Content-Type': 'application/json',
          'X-App-Key': this.appKey,
          'X-Signature': signature,
          'X-Timestamp': data.timestamp.toString(),
          'User-Agent': 'LCH-IoT-Service/1.0.0',
        };

        this.logger.log(`[API请求] ${endpoint}, 尝试次数: ${attempt}/${retries}`, 'IotService');
        
        const response = await firstValueFrom(
          this.httpService.post(url, data, {
            headers,
            timeout: 10000, // 10秒超时
            validateStatus: () => true, // 允许所有状态码
          })
        );

        // 验证响应
        if (response.status === 200 && response.data) {
          const apiResponse = response.data as IotApiResponse;
          
          // 验证响应签名（如果配置了密钥）
          if (this.appSecret && !this.verifyResponseSignature(apiResponse)) {
            throw new Error('响应签名验证失败');
          }
          
          return apiResponse;
        } else {
          throw new Error(`HTTP请求失败: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        this.logger.warn(
          `API请求失败 (${attempt}/${retries}): ${endpoint}, 错误: ${error.message}`,
          'IotService'
        );
        
        if (attempt === retries) {
          throw error;
        }
        
        // 指数退避重试
        const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    throw new Error('API请求重试次数耗尽');
  }

  /**
   * 生成API请求签名
   */
  private generateSignature(data: any): string {
    // 构造签名字符串：按字段名排序后拼接
    const sortedKeys = Object.keys(data).sort();
    const signString = sortedKeys
      .map(key => `${key}=${JSON.stringify(data[key])}`)
      .join('&');
    
    // 添加密钥
    const signStringWithSecret = `${signString}&secret=${this.appSecret}`;
    
    // 生成HMAC-SHA256签名
    const signature = createHmac('sha256', this.appSecret)
      .update(signStringWithSecret)
      .digest('hex')
      .toUpperCase();
    
    return signature;
  }

  /**
   * 验证API响应签名
   */
  private verifyResponseSignature(response: IotApiResponse): boolean {
    try {
      const { signature, ...dataWithoutSignature } = response as any;
      if (!signature) return true; // 如果没有签名字段，跳过验证
      
      const expectedSignature = this.generateSignature(dataWithoutSignature);
      return signature === expectedSignature;
    } catch (error) {
      this.logger.error(`验证响应签名异常: ${error.message}`, error.stack, 'IotService');
      return false;
    }
  }

  /**
   * 验证设备上报数据签名
   */
  private verifyReportSignature(reportData: any): boolean {
    try {
      const { signature, ...dataWithoutSignature } = reportData;
      if (!signature) return false;
      
      const expectedSignature = this.generateSignature(dataWithoutSignature);
      return signature === expectedSignature;
    } catch (error) {
      this.logger.error(`验证上报数据签名异常: ${error.message}`, error.stack, 'IotService');
      return false;
    }
  }

  /**
   * 映射IoT状态到系统状态
   */
  private mapIotStatusToSystem(iotStatus: string): IotDeviceStatus {
    switch (iotStatus?.toLowerCase()) {
      case 'online':
      case '1':
        return IotDeviceStatus.ONLINE;
      case 'working':
      case 'busy':
      case '2':
        return IotDeviceStatus.WORKING;
      case 'error':
      case 'fault':
      case '3':
        return IotDeviceStatus.ERROR;
      default:
        return IotDeviceStatus.OFFLINE;
    }
  }

  /**
   * 模拟设备命令（开发测试用）
   */
  private async simulateCommand(
    devid: string, 
    command: IotCommandType, 
    params?: IotControlParams
  ): Promise<{ success: boolean; message: string; data?: any }> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // 模拟10%的失败率
    if (Math.random() < 0.1) {
      return {
        success: false,
        message: `模拟错误: 设备${devid}响应超时`,
      };
    }

    this.logger.log(`[模拟模式] 设备命令: ${devid}, 命令: ${command}, 参数: ${JSON.stringify(params)}`, 'IotService');
    
    return {
      success: true,
      message: '命令执行成功',
      data: {
        devid,
        command,
        executedAt: new Date().toISOString(),
        estimatedDuration: params?.duration || 30,
      },
    };
  }

  /**
   * 模拟设备状态（开发测试用）
   */
  private async simulateDeviceStatus(devid: string): Promise<DeviceStatusReport> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    const statuses = [IotDeviceStatus.ONLINE, IotDeviceStatus.WORKING, IotDeviceStatus.OFFLINE];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      devid,
      status: randomStatus,
      signal: 60 + Math.floor(Math.random() * 40), // 60-99
      battery: 20 + Math.floor(Math.random() * 80), // 20-99
      temperature: 15 + Math.floor(Math.random() * 25), // 15-40°C
      pressure: 2 + Math.floor(Math.random() * 3), // 2-4
      workTime: Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
    };
  }
}