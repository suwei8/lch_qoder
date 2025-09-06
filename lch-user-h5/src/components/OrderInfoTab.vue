<template>
  <div class="order-info-tab">
    <!-- 服务信息 -->
    <div class="info-section">
      <h3>服务信息</h3>
      <div class="info-items">
        <div class="info-item">
          <span class="label">门店名称</span>
          <span class="value">{{ order.storeName }}</span>
        </div>
        <div class="info-item">
          <span class="label">设备编号</span>
          <span class="value">{{ order.deviceName }}</span>
        </div>
        <div class="info-item">
          <span class="label">服务类型</span>
          <span class="value">自助洗车</span>
        </div>
        <div v-if="order.duration" class="info-item">
          <span class="label">使用时长</span>
          <span class="value">{{ formatDuration(order.duration) }}</span>
        </div>
        <div class="info-item">
          <span class="label">下单时间</span>
          <span class="value">{{ formatDateTime(order.createdAt) }}</span>
        </div>
        <div v-if="order.startTime" class="info-item">
          <span class="label">开始时间</span>
          <span class="value">{{ formatDateTime(order.startTime) }}</span>
        </div>
        <div v-if="order.endTime" class="info-item">
          <span class="label">结束时间</span>
          <span class="value">{{ formatDateTime(order.endTime) }}</span>
        </div>
      </div>
    </div>

    <!-- 订单信息 -->
    <div class="info-section">
      <h3>订单信息</h3>
      <div class="info-items">
        <div class="info-item">
          <span class="label">订单号</span>
          <span class="value">
            {{ order.orderNo || order.id }}
            <van-button 
              type="primary" 
              size="mini" 
              plain 
              @click="copyOrderNo"
            >
              复制
            </van-button>
          </span>
        </div>
        <div class="info-item">
          <span class="label">订单状态</span>
          <span class="value status" :class="statusClass">{{ statusText }}</span>
        </div>
        <div v-if="order.cancelReason" class="info-item">
          <span class="label">取消原因</span>
          <span class="value">{{ order.cancelReason }}</span>
        </div>
      </div>
    </div>

    <!-- 费用明细 -->
    <div class="info-section">
      <h3>费用明细</h3>
      <div class="price-details">
        <div class="price-item">
          <span class="label">服务费用</span>
          <span class="value">¥{{ (order.originalAmount || order.amount).toFixed(2) }}</span>
        </div>
        
        <div v-if="order.couponId" class="price-item discount">
          <span class="label">优惠券优惠</span>
          <span class="value">-¥{{ order.discountAmount?.toFixed(2) || '0.00' }}</span>
        </div>
        
        <div v-if="order.platformDiscount" class="price-item discount">
          <span class="label">平台优惠</span>
          <span class="value">-¥{{ order.platformDiscount.toFixed(2) }}</span>
        </div>
        
        <div class="price-item total">
          <span class="label">实付金额</span>
          <span class="value">¥{{ order.payAmount.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <!-- 支付信息 -->
    <div v-if="order.paymentMethod" class="info-section">
      <h3>支付信息</h3>
      <div class="info-items">
        <div class="info-item">
          <span class="label">支付方式</span>
          <span class="value">{{ paymentMethodText }}</span>
        </div>
        <div v-if="order.payTime" class="info-item">
          <span class="label">支付时间</span>
          <span class="value">{{ formatDateTime(order.payTime) }}</span>
        </div>
        <div v-if="order.transactionId" class="info-item">
          <span class="label">交易单号</span>
          <span class="value">
            {{ order.transactionId }}
            <van-button 
              type="primary" 
              size="mini" 
              plain 
              @click="copyTransactionId"
            >
              复制
            </van-button>
          </span>
        </div>
      </div>
    </div>

    <!-- 门店信息 -->
    <div class="info-section">
      <h3>门店信息</h3>
      <div class="info-items">
        <div class="info-item">
          <span class="label">门店地址</span>
          <span class="value">{{ order.storeAddress || '暂无地址信息' }}</span>
        </div>
        <div v-if="order.storePhone" class="info-item">
          <span class="label">联系电话</span>
          <span class="value">
            {{ order.storePhone }}
            <van-button 
              type="primary" 
              size="mini" 
              plain 
              @click="callStore"
            >
              拨打
            </van-button>
          </span>
        </div>
      </div>
    </div>

    <!-- 备注信息 -->
    <div v-if="order.remark" class="info-section">
      <h3>备注信息</h3>
      <div class="remark-content">
        <p>{{ order.remark }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Order } from '@/types'
import { formatDateTime, formatDuration } from '@/utils/date'
import { Toast } from 'vant'

interface Props {
  order: Order
}

const props = defineProps<Props>()

// 状态文本
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

// 状态样式
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

// 支付方式文本
const paymentMethodText = computed(() => {
  const methodMap = {
    wechat: '微信支付',
    balance: '余额支付',
    gift: '赠送余额'
  }
  return methodMap[props.order.paymentMethod as keyof typeof methodMap] || '未知'
})

// 复制订单号
const copyOrderNo = async () => {
  try {
    await navigator.clipboard.writeText(props.order.orderNo || props.order.id)
    Toast.success('订单号已复制')
  } catch (error) {
    Toast.fail('复制失败')
  }
}

// 复制交易单号
const copyTransactionId = async () => {
  try {
    if (props.order.transactionId) {
      await navigator.clipboard.writeText(props.order.transactionId)
      Toast.success('交易单号已复制')
    }
  } catch (error) {
    Toast.fail('复制失败')
  }
}

// 拨打门店电话
const callStore = () => {
  if (props.order.storePhone) {
    window.location.href = `tel:${props.order.storePhone}`
  }
}
</script>

<style scoped>
.order-info-tab {
  padding: 0;
}

.info-section {
  background: white;
  margin-bottom: 12px;
  padding: 16px;
  border-radius: 8px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebedf0;
}

.info-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 20px;
}

.info-item .label {
  font-size: 14px;
  color: #646566;
  flex-shrink: 0;
  width: 80px;
}

.info-item .value {
  font-size: 14px;
  color: #323233;
  text-align: right;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.status {
  font-weight: 600;
}

.status-pending {
  color: #ff9500;
}

.status-paid,
.status-using {
  color: #1989fa;
}

.status-completed {
  color: #07c160;
}

.status-cancelled {
  color: #969799;
}

.status-refunding,
.status-refunded {
  color: #ff9500;
}

.price-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.price-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.price-item.discount .value {
  color: #07c160;
}

.price-item.total {
  padding-top: 12px;
  border-top: 1px solid #ebedf0;
  font-size: 16px;
  font-weight: 600;
}

.price-item.total .value {
  color: #ee0a24;
  font-size: 18px;
}

.remark-content {
  background: #f7f8fa;
  border-radius: 8px;
  padding: 12px;
}

.remark-content p {
  font-size: 14px;
  color: #646566;
  line-height: 1.5;
  margin: 0;
}
</style>