<template>
  <div class="order-item">
    <div class="order-header">
      <div class="store-info">
        <h3>{{ order.storeName }}</h3>
        <span class="device-name">{{ order.deviceName }}</span>
      </div>
      <div class="order-status" :class="statusClass">
        {{ statusText }}
      </div>
    </div>

    <div class="order-content" @click="$emit('viewDetail', order)">
      <div class="service-info">
        <div class="service-item">
          <span class="service-name">自助洗车服务</span>
          <span class="service-duration" v-if="order.duration">
            {{ Math.ceil(order.duration / 60) }}分钟
          </span>
        </div>
        
        <div class="order-time">
          <van-icon name="clock-o" />
          <span>{{ formatDateTime(order.createdAt) }}</span>
        </div>
      </div>

      <div class="order-amount">
        <div class="amount-info">
          <span v-if="order.originalAmount !== order.payAmount" class="original-amount">
            ¥{{ order.originalAmount?.toFixed(2) }}
          </span>
          <span class="pay-amount">¥{{ order.payAmount.toFixed(2) }}</span>
        </div>
        <div v-if="order.couponId" class="coupon-info">
          <van-tag type="success">优惠券</van-tag>
        </div>
      </div>
    </div>

    <div class="order-actions">
      <div class="order-id">订单号：{{ order.orderNo || order.id }}</div>
      <div class="action-buttons">
        <!-- 待支付状态 -->
        <template v-if="order.status === 'pending'">
          <van-button size="small" @click="$emit('cancel', order)">
            取消订单
          </van-button>
          <van-button type="primary" size="small" @click="$emit('pay', order)">
            立即支付
          </van-button>
        </template>

        <!-- 使用中状态 -->
        <template v-else-if="order.status === 'using'">
          <van-button size="small" @click="$emit('viewDetail', order)">
            查看详情
          </van-button>
        </template>

        <!-- 已完成状态 -->
        <template v-else-if="order.status === 'completed'">
          <van-button size="small" @click="$emit('delete', order)">
            删除订单
          </van-button>
          <van-button size="small" @click="$emit('refund', order)">
            申请退款
          </van-button>
          <van-button type="primary" size="small" @click="$emit('reorder', order)">
            再次购买
          </van-button>
        </template>

        <!-- 已取消状态 -->
        <template v-else-if="order.status === 'cancelled'">
          <van-button size="small" @click="$emit('delete', order)">
            删除订单
          </van-button>
          <van-button type="primary" size="small" @click="$emit('reorder', order)">
            再次购买
          </van-button>
        </template>

        <!-- 退款中状态 -->
        <template v-else-if="order.status === 'refunding'">
          <van-button size="small" @click="$emit('viewDetail', order)">
            查看进度
          </van-button>
        </template>

        <!-- 已退款状态 -->
        <template v-else-if="order.status === 'refunded'">
          <van-button size="small" @click="$emit('delete', order)">
            删除订单
          </van-button>
        </template>

        <!-- 其他状态 -->
        <template v-else>
          <van-button size="small" @click="$emit('viewDetail', order)">
            查看详情
          </van-button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Order } from '@/types'
import { formatDateTime } from '@/utils/date'

interface Props {
  order: Order
}

const props = defineProps<Props>()

defineEmits<{
  viewDetail: [order: Order]
  cancel: [order: Order]
  pay: [order: Order]
  refund: [order: Order]
  reorder: [order: Order]
  delete: [order: Order]
}>()

// 状态文本映射
const statusText = computed(() => {
  const statusMap = {
    pending: '待支付',
    paid: '已支付',
    using: '使用中',
    completed: '已完成',
    cancelled: '已取消',
    refunding: '退款中',
    refunded: '已退款'
  }
  return statusMap[props.order.status as keyof typeof statusMap] || '未知'
})

// 状态样式类
const statusClass = computed(() => {
  const classMap = {
    pending: 'status-pending',
    paid: 'status-paid',
    using: 'status-using',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
    refunding: 'status-refunding',
    refunded: 'status-refunded'
  }
  return classMap[props.order.status as keyof typeof classMap] || ''
})
</script>

<style scoped>
.order-item {
  background: white;
  margin-bottom: 12px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px 0;
}

.store-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 4px;
}

.device-name {
  font-size: 12px;
  color: #969799;
}

.order-status {
  font-size: 14px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
}

.status-pending {
  color: #ff9500;
  background: #fff7e6;
}

.status-paid,
.status-using {
  color: #1989fa;
  background: #e8f4ff;
}

.status-completed {
  color: #07c160;
  background: #f0f9ff;
}

.status-cancelled {
  color: #969799;
  background: #f7f8fa;
}

.status-refunding {
  color: #ff9500;
  background: #fff7e6;
}

.status-refunded {
  color: #969799;
  background: #f7f8fa;
}

.order-content {
  padding: 12px 16px;
  cursor: pointer;
}

.service-info {
  margin-bottom: 8px;
}

.service-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.service-name {
  font-size: 14px;
  color: #323233;
}

.service-duration {
  font-size: 12px;
  color: #969799;
}

.order-time {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #969799;
}

.order-time .van-icon {
  margin-right: 4px;
}

.order-amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.original-amount {
  font-size: 12px;
  color: #969799;
  text-decoration: line-through;
}

.pay-amount {
  font-size: 16px;
  font-weight: 600;
  color: #ee0a24;
}

.coupon-info {
  font-size: 12px;
}

.order-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid #ebedf0;
  background: #fafafa;
}

.order-id {
  font-size: 12px;
  color: #969799;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-buttons .van-button {
  min-width: 64px;
  height: 28px;
  font-size: 12px;
}
</style>