import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig, ConfigType } from '../entities/system-config.entity';

@Injectable()
export class SystemConfigService {
  constructor(
    @InjectRepository(SystemConfig)
    private configRepository: Repository<SystemConfig>,
  ) {}

  // 获取所有配置
  async findAll(): Promise<SystemConfig[]> {
    return this.configRepository.find({
      order: { category: 'ASC', config_key: 'ASC' }
    });
  }

  // 获取公开配置
  async findPublic(): Promise<SystemConfig[]> {
    return this.configRepository.find({
      where: { is_public: true },
      order: { category: 'ASC', config_key: 'ASC' }
    });
  }

  // 按分类获取配置
  async findByCategory(category: string): Promise<SystemConfig[]> {
    return this.configRepository.find({
      where: { category },
      order: { config_key: 'ASC' }
    });
  }

  // 根据键获取配置
  async findByKey(key: string): Promise<SystemConfig> {
    return this.configRepository.findOne({ where: { config_key: key } });
  }

  // 获取配置值
  async getValue<T = any>(key: string, defaultValue?: T): Promise<T> {
    const config = await this.findByKey(key);
    return config ? config.getValue<T>() : defaultValue;
  }

  // 创建配置
  async create(configData: Partial<SystemConfig>): Promise<SystemConfig> {
    const config = this.configRepository.create(configData);
    return this.configRepository.save(config);
  }

  // 更新配置
  async update(key: string, value: any): Promise<SystemConfig> {
    const config = await this.findByKey(key);
    if (!config) {
      throw new Error(`配置项 ${key} 不存在`);
    }

    if (!config.is_editable) {
      throw new Error(`配置项 ${key} 不可编辑`);
    }

    config.setValue(value);
    return this.configRepository.save(config);
  }

  // 批量更新配置
  async updateBatch(configs: { key: string; value: any }[]): Promise<SystemConfig[]> {
    const results = [];
    for (const { key, value } of configs) {
      const config = await this.update(key, value);
      results.push(config);
    }
    return results;
  }

  // 删除配置
  async remove(key: string): Promise<void> {
    const config = await this.findByKey(key);
    if (config && !config.is_editable) {
      throw new Error(`配置项 ${key} 不可删除`);
    }
    await this.configRepository.delete({ config_key: key });
  }

  // 重置配置到默认值
  async resetToDefault(key: string): Promise<SystemConfig> {
    // 这里可以定义默认配置值
    const defaultConfigs = {
      'min_recharge_amount': '10',
      'max_recharge_amount': '1000',
      'default_wash_price': '3',
      'new_user_gift_amount': '10',
      // 添加更多默认配置...
    };

    const defaultValue = defaultConfigs[key];
    if (!defaultValue) {
      throw new Error(`没有为 ${key} 定义默认值`);
    }

    return this.update(key, defaultValue);
  }

  // 获取配置分组
  async getGroupedConfigs(): Promise<{ [category: string]: SystemConfig[] }> {
    const configs = await this.findAll();
    const grouped = {};

    configs.forEach(config => {
      if (!grouped[config.category]) {
        grouped[config.category] = [];
      }
      grouped[config.category].push(config);
    });

    return grouped;
  }
}