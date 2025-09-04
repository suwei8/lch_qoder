import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
// import { Merchant } from '../../merchants/entities/merchant.entity';
// import { Order } from '../../orders/entities/order.entity';

export enum DeviceType {
  CAR_WASH = 'car_wash',
  DRYER = 'dryer',
  VACUUM = 'vacuum'
}

export enum DeviceStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance',
  ERROR = 'error'
}

export enum DeviceWorkStatus {
  IDLE = 'idle',
  WORKING = 'working',
  PAUSED = 'paused'
}

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  device_id: string;

  @Column({ length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: DeviceType,
    default: DeviceType.CAR_WASH
  })
  type: DeviceType;

  @Column()
  merchant_id: number;

  @Column({ length: 200 })
  location: string;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  longitude: number;

  @Column({
    type: 'enum',
    enum: DeviceStatus,
    default: DeviceStatus.OFFLINE
  })
  status: DeviceStatus;

  @Column({
    type: 'enum',
    enum: DeviceWorkStatus,
    default: DeviceWorkStatus.IDLE
  })
  work_status: DeviceWorkStatus;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  price_per_minute: number;

  @Column({ type: 'int', default: 30 })
  min_duration_minutes: number;

  @Column({ type: 'int', default: 180 })
  max_duration_minutes: number;

  @Column({ type: 'json', nullable: true })
  settings: any;

  @Column({ type: 'json', nullable: true })
  capabilities: any;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  water_level: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  soap_level: number;

  @Column({ type: 'int', default: 0 })
  total_usage_count: number;

  @Column({ type: 'int', default: 0 })
  total_usage_minutes: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_revenue: number;

  @Column({ nullable: true })
  last_maintenance_at: Date;

  @Column({ nullable: true })
  last_online_at: Date;

  @Column({ nullable: true })
  last_error_at: Date;

  @Column({ nullable: true, type: 'text' })
  last_error_message: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // 关联关系
  // @ManyToOne(() => Merchant, merchant => merchant.devices)
  // @JoinColumn({ name: 'merchant_id' })
  // merchant: Merchant;

  // @OneToMany(() => Order, order => order.device)
  // orders: Order[];

  // 计算属性
  get isOnline(): boolean {
    return this.status === DeviceStatus.ONLINE;
  }

  get isWorking(): boolean {
    return this.work_status === DeviceWorkStatus.WORKING;
  }

  get isAvailable(): boolean {
    return this.isOnline && this.work_status === DeviceWorkStatus.IDLE;
  }

  get hasError(): boolean {
    return this.status === DeviceStatus.ERROR;
  }

  get needsMaintenance(): boolean {
    return this.status === DeviceStatus.MAINTENANCE;
  }

  get waterLevelLow(): boolean {
    return this.water_level !== null && this.water_level < 20;
  }

  get soapLevelLow(): boolean {
    return this.soap_level !== null && this.soap_level < 20;
  }
}