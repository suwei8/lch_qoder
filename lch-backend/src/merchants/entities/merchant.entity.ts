import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
// import { Device } from '../../devices/entities/device.entity';
// import { Order } from '../../orders/entities/order.entity';

export enum MerchantStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended'
}

export enum SettlementCycle {
  DAILY = 'daily',
  WEEKLY = 'weekly', 
  MONTHLY = 'monthly'
}

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  user_id: number;

  @Column({ length: 100 })
  company_name: string;

  @Column({ length: 100 })
  contact_person: string;

  @Column({ length: 20 })
  contact_phone: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 200 })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ length: 18, unique: true })
  business_license: string;

  @Column({ length: 500, nullable: true })
  business_license_image: string;

  @Column({ length: 18, nullable: true })
  legal_person_id: string;

  @Column({ length: 500, nullable: true })
  legal_person_id_image: string;

  @Column({
    type: 'enum',
    enum: MerchantStatus,
    default: MerchantStatus.PENDING
  })
  status: MerchantStatus;

  @Column({ type: 'text', nullable: true })
  reject_reason: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.70 })
  commission_rate: number;

  @Column({
    type: 'enum',
    enum: SettlementCycle,
    default: SettlementCycle.DAILY
  })
  settlement_cycle: SettlementCycle;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_revenue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pending_settlement: number;

  @Column({ nullable: true })
  approved_at: Date;

  @Column({ nullable: true })
  approved_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // 关联关系
  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // @OneToMany(() => Device, device => device.merchant)
  // devices: Device[];

  // @OneToMany(() => Order, order => order.merchant)
  // orders: Order[];

  // 计算属性
  get isApproved(): boolean {
    return this.status === MerchantStatus.APPROVED;
  }

  get isPending(): boolean {
    return this.status === MerchantStatus.PENDING;
  }

  get isRejected(): boolean {
    return this.status === MerchantStatus.REJECTED;
  }

  get isSuspended(): boolean {
    return this.status === MerchantStatus.SUSPENDED;
  }
}