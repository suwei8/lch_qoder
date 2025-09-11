import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum NotificationType {
  SYSTEM = 'system',
  ORDER = 'order',
  PAYMENT = 'payment',
  DEVICE = 'device',
  MERCHANT = 'merchant',
  PROMOTION = 'promotion'
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum ActionType {
  NONE = 'none',
  URL = 'url',
  PAGE = 'page'
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, comment: '用户ID(NULL表示系统通知)' })
  user_id: number;

  @Column({
    type: 'enum',
    enum: NotificationType,
    comment: '通知类型'
  })
  type: NotificationType;

  @Column({ length: 200, comment: '通知标题' })
  title: string;

  @Column({ type: 'text', comment: '通知内容' })
  content: string;

  @Column({ type: 'json', nullable: true, comment: '额外数据' })
  extra_data: any;

  @Column({ type: 'boolean', default: false, comment: '是否已读' })
  is_read: boolean;

  @Column({ type: 'boolean', default: false, comment: '是否全局通知' })
  is_global: boolean;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
    comment: '优先级'
  })
  priority: NotificationPriority;

  @Column({
    type: 'enum',
    enum: ActionType,
    default: ActionType.NONE,
    comment: '动作类型'
  })
  action_type: ActionType;

  @Column({ length: 500, nullable: true, comment: '动作数据' })
  action_data: string;

  @Column({ nullable: true, comment: '过期时间' })
  expire_at: Date;

  @Column({ nullable: true, comment: '发送时间' })
  send_at: Date;

  @CreateDateColumn({ comment: '创建时间' })
  created_at: Date;

  @UpdateDateColumn({ comment: '更新时间' })
  updated_at: Date;

  // 计算属性
  get isExpired(): boolean {
    return this.expire_at ? new Date() > this.expire_at : false;
  }

  get isValid(): boolean {
    return !this.isExpired;
  }
}