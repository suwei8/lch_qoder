import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserRole, UserStatus } from '../../common/interfaces/common.interface';
// import { Order } from '../../orders/entities/order.entity';


@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  phone: string;

  @Column({ nullable: true, length: 100 })
  nickname: string;

  @Column({ nullable: true, length: 500 })
  avatar: string;

  @Column({ nullable: true, length: 100 })
  wechat_openid: string;

  @Column({ nullable: true, length: 100 })
  wechat_unionid: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE
  })
  status: UserStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '余额(分)' })
  balance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '赠送余额(分)' })
  gift_balance: number;

  @Column({ nullable: true, length: 200 })
  address: string;

  @Column({ nullable: true, length: 50 })
  province: string;

  @Column({ nullable: true, length: 50 })
  city: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  last_login_at: Date;

  @Column({ nullable: true, length: 50 })
  last_login_ip: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // 关联关系
  // @OneToMany(() => Order, order => order.user)
  // orders: Order[];

  // 计算属性
  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  get isMerchant(): boolean {
    return this.role === UserRole.MERCHANT;
  }

  get isPlatformAdmin(): boolean {
    return this.role === UserRole.PLATFORM_ADMIN;
  }
}