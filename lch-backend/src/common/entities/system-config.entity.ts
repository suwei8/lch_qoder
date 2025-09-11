import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ConfigType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json'
}

@Entity('system_configs')
export class SystemConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true, comment: '配置键' })
  config_key: string;

  @Column({ type: 'text', comment: '配置值' })
  config_value: string;

  @Column({
    type: 'enum',
    enum: ConfigType,
    default: ConfigType.STRING,
    comment: '配置类型'
  })
  config_type: ConfigType;

  @Column({ length: 50, default: 'general', comment: '配置分类' })
  category: string;

  @Column({ type: 'text', nullable: true, comment: '配置描述' })
  description: string;

  @Column({ type: 'boolean', default: false, comment: '是否公开(前端可访问)' })
  is_public: boolean;

  @Column({ type: 'boolean', default: true, comment: '是否可编辑' })
  is_editable: boolean;

  @CreateDateColumn({ comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updated_at: Date;

  // 获取配置值的类型化方法
  getValue<T = any>(): T {
    switch (this.config_type) {
      case ConfigType.NUMBER:
        return Number(this.config_value) as T;
      case ConfigType.BOOLEAN:
        return (this.config_value === 'true') as T;
      case ConfigType.JSON:
        return JSON.parse(this.config_value) as T;
      default:
        return this.config_value as T;
    }
  }

  // 设置配置值的类型化方法
  setValue(value: any): void {
    switch (this.config_type) {
      case ConfigType.JSON:
        this.config_value = JSON.stringify(value);
        break;
      default:
        this.config_value = String(value);
    }
  }
}