import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

export enum TransactionType {
  RECHARGE = 'recharge',        // 充值
  CONSUMPTION = 'consumption',  // 消费
  REFUND = 'refund',           // 退款
  GIFT = 'gift',               // 赠送
  WITHDRAW = 'withdraw'        // 提现
}

export enum TransactionStatus {
  PENDING = 'pending',     // 处理中
  SUCCESS = 'success',     // 成功
  FAILED = 'failed'        // 失败
}

@Entity('balance_transactions')
export class BalanceTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', comment: '用户ID' })
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: TransactionType,
    comment: '交易类型'
  })
  type: TransactionType;

  @Column({ type: 'int', comment: '交易金额(分)' })
  amount: number;

  @Column({ type: 'int', default: 0, comment: '使用普通余额(分)' })
  balance_used: number;

  @Column({ type: 'int', default: 0, comment: '使用赠送余额(分)' })
  gift_balance_used: number;

  @Column({ type: 'int', comment: '交易前余额(分)' })
  balance_before: number;

  @Column({ type: 'int', comment: '交易后余额(分)' })
  balance_after: number;

  @Column({ type: 'int', comment: '交易前赠送余额(分)' })
  gift_balance_before: number;

  @Column({ type: 'int', comment: '交易后赠送余额(分)' })
  gift_balance_after: number;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.SUCCESS,
    comment: '交易状态'
  })
  status: TransactionStatus;

  @Column({ type: 'varchar', length: 255, comment: '交易描述' })
  description: string;

  @Column({ type: 'int', nullable: true, comment: '关联订单ID' })
  order_id?: number;

  @Column({ type: 'varchar', length: 128, nullable: true, comment: '外部交易号' })
  external_transaction_id?: string;

  @CreateDateColumn({ comment: '创建时间' })
  created_at: Date;
}