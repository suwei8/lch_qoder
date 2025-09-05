import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { DeviceStatus } from '../../common/interfaces/common.interface';

/**
 * 设备实体
 * @author Lily
 * @description 洗车IOT设备管理，支持智链物联设备集成
 */

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 32, comment: '智链物联设备ID' })
  devid: string;

  @Column({ comment: '所属商户ID' })
  merchant_id: number;

  @Column({ length: 64, comment: '设备名称' })
  name: string;

  @Column({ length: 255, nullable: true, comment: '设备描述' })
  description: string;

  @Column({
    type: 'enum',
    enum: DeviceStatus,
    default: DeviceStatus.OFFLINE,
    comment: '设备状态'
  })
  status: DeviceStatus;

  @Column({ length: 255, nullable: true, comment: '设备位置' })
  location: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true, comment: '纬度' })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true, comment: '经度' })
  longitude: number;

  @Column({ type: 'int', unsigned: true, default: 300, comment: '每分钟价格(分)' })
  price_per_minute: number;

  @Column({ type: 'int', unsigned: true, default: 500, comment: '最低消费金额(分)' })
  min_amount: number;

  @Column({ type: 'int', unsigned: true, default: 120, comment: '最大使用时间(分钟)' })
  max_usage_minutes: number;

  @Column({ type: 'json', nullable: true, comment: '设备配置参数' })
  config_params: any;

  @Column({ length: 32, nullable: true, comment: 'SIM卡ICCID' })
  iccid: string;

  @Column({ type: 'int', unsigned: true, default: 0, comment: '累计订单数' })
  total_orders: number;

  @Column({ type: 'int', unsigned: true, default: 0, comment: '累计营收(分)' })
  total_revenue: number;

  @Column({ type: 'timestamp', nullable: true, comment: '最后在线时间' })
  last_seen_at: Date;

  @Column({ type: 'timestamp', nullable: true, comment: '最后订单时间' })
  last_order_at: Date;

  @Column({ type: 'boolean', default: true, comment: '是否启用' })
  is_active: boolean;

  @Column({ length: 32, nullable: true, comment: '固件版本' })
  firmware_version: string;

  @Column({ length: 32, nullable: true, comment: '信号强度' })
  signal_strength: string;

  @CreateDateColumn({ comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updated_at: Date;

  // 关联关系
  @ManyToOne(() => require('../../merchants/entities/merchant.entity').Merchant)
  @JoinColumn({ name: 'merchant_id' })
  merchant: any;

  // @OneToMany(() => Order, order => order.device)
  // orders: Order[];

  // 业务方法
  /**
   * 判断设备是否在线
   */
  get isOnline(): boolean {
    return this.status === DeviceStatus.ONLINE;
  }

  /**
   * 判断设备是否可用（在线且空闲）
   */
  get isAvailable(): boolean {
    return this.status === DeviceStatus.ONLINE && this.is_active;
  }

  /**
   * 判断设备是否离线
   */
  get isOffline(): boolean {
    return this.status === DeviceStatus.OFFLINE;
  }

  /**
   * 判断设备是否正在使用中
   */
  get isBusy(): boolean {
    return this.status === 'busy' as any; // 对应数据库中的busy状态
  }

  /**
   * 更新设备在线状态
   */
  updateOnlineStatus(isOnline: boolean): void {
    this.status = isOnline ? DeviceStatus.ONLINE : DeviceStatus.OFFLINE;
    this.last_seen_at = new Date();
  }

  /**
   * 记录订单使用
   */
  recordOrderUsage(amount: number): void {
    this.total_orders += 1;
    this.total_revenue += amount;
    this.last_order_at = new Date();
  }

  /**
   * 获取设备位置信息
   */
  get locationInfo(): { latitude: number; longitude: number; address: string } | null {
    if (this.latitude && this.longitude) {
      return {
        latitude: this.latitude,
        longitude: this.longitude,
        address: this.location || '未知位置'
      };
    }
    return null;
  }
}