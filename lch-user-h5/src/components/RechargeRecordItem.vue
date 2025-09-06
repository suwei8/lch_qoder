<template>
  <div class="record-item" @click="$emit('viewDetail', record)">
    <div class="record-header">
      <div class="package-info">
        <h3>{{ record.packageName }}</h3>
        <span class="record-time">{{ formatDateTime(record.createdAt) }}</span>
      </div>
      <div class="record-status" :class="statusClass">
        {{ statusText }}
      </div>
    </div>

    <div class="record-content">
      <div class="amount-info">
        <div class="main-amount">
          <span class="amount-label">充值金额:</span>
          <span class="amount-value">¥{{ record.amount.toFixed(2) }}</span>
        </div>
        
        <div v-if="record.giftAmount > 0" class="gift-amount">
          <span class="amount-label">赠送金额:</span>
          <span class="amount-value gift">+¥{{ record.giftAmount.toFixed(2) }}</span>
        </div>
        
        <div class="total-amount">
          <span class="amount-label">实得金额:</span>
          <span class="amount-value total">¥{{ record.totalAmount.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <div class="record-footer">
      <div class="payment-info">
        <span class="payment-method">{{ paymentMethodText }}</span>
        <span v-if="record.transactionId" class="transaction-id">
          交易号：{{ record.transactionId }}
        </span>
      </div>
      
      <div class="record-actions">
        <van-icon name="arrow" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RechargeRecord } from '@/api/recharge'
import { formatDateTime } from '@/utils/date'

interface Props {
  record: RechargeRecord
}

const props = defineProps<Props>()

defineEmits<{
  viewDetail: [record: RechargeRecord]
}>()

// 状态文本
const statusText = computed(() => {
  const statusMap = {
    pending: '待支付',
    paid: '已完成',
    cancelled: '已取消',
    failed: '支付失败'
  }
  return statusMap[props.record.status] || '未知'
})

// 状态样式
const statusClass = computed(() => {
  const classMap = {
    pending: 'status-pending',
    paid: 'status-success',
    cancelled: 'status-cancelled',
    failed: 'status-failed'
  }
  return classMap[props.record.status] || ''
})

// 支付方式文本
const paymentMethodText = computed(() => {
  const methodMap = {
    wechat: '微信支付',
    alipay: '支付宝',
    balance: '余额支付'
  }
  return methodMap[props.record.paymentMethod as keyof typeof methodMap] || '未知'
})
</script>

<style scoped>
.record-item {
  background: white;
  margin: 0 12px 12px;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s;
}

.record-item:active {
  background: #f8fafe;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.package-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 4px;
}

.record-time {
  font-size: 12px;
  color: #969799;
}

.record-status {
  font-size: 14px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
}

.status-pending {
  color: #ff9500;
  background: #fff7e6;
}

.status-success {
  color: #07c160;
  background: #f0f9ff;
}

.status-cancelled {
  color: #969799;
  background: #f7f8fa;
}

.status-failed {
  color: #ee0a24;
  background: #ffeef0;
}

.record-content {
  margin-bottom: 12px;
}

.amount-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.main-amount,
.gift-amount,
.total-amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount-label {
  font-size: 14px;
  color: #646566;
}

.amount-value {
  font-size: 14px;
  color: #323233;
  font-weight: 600;
}

.amount-value.gift {
  color: #07c160;
}

.amount-value.total {
  color: #ee0a24;
  font-size: 16px;
}

.record-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #ebedf0;
}

.payment-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.payment-method {
  font-size: 14px;
  color: #323233;
  font-weight: 500;
}

.transaction-id {
  font-size: 12px;
  color: #969799;
}

.record-actions {
  color: #c8c9cc;
}
</style>