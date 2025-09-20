<template>
  <div class="order-detail-container">
    <!-- 导航栏 -->
    <van-nav-bar title="订单详情" left-arrow @click-left="goBack" />

    <div v-if="orderDetail" class="order-content">
      <!-- 订单状态 -->
      <div class="status-card">
        <div class="status-icon" :class="orderDetail.status">
          <van-icon :name="getStatusIcon(orderDetail.status)" />
        </div>
        <div class="status-info">
          <h2 class="status-title">{{ getStatusText(orderDetail.status) }}</h2>
          <p class="status-desc">{{ getStatusDescription(orderDetail.status) }}</p>
          <p class="order-time">{{ formatTime(orderDetail.createdAt) }}</p>
        </div>
      </div>

      <!-- 服务信息 -->
      <div class="service-card">
        <h3 class="card-title">服务信息</h3>
        <div class="service-info">
          <div class="service-header">
            <h4 class="service-name">{{ orderDetail.serviceName }}</h4>
            <span class="service-price">¥{{ orderDetail.servicePrice }}</span>
          </div>
          <p class="service-desc">{{ orderDetail.serviceDescription }}</p>
          <div class="service-features">
            <span 
              v-for="feature in orderDetail.serviceFeatures" 
              :key="feature"
              class="feature-tag"
            >
              {{ feature }}
            </span>
          </div>
        </div>
      </div>

      <!-- 门店信息 -->
      <div class="store-card">
        <h3 class="card-title">门店信息</h3>
        <div class="store-info">
          <div class="store-header">
            <van-icon name="shop-o" />
            <span class="store-name">{{ orderDetail.storeName }}</span>
          </div>
          <div class="store-address">
            <van-icon name="location-o" />
            <span>{{ orderDetail.storeAddress }}</span>
          </div>
          <div class="store-phone">
            <van-icon name="phone-o" />
            <span>{{ orderDetail.storePhone }}</span>
          </div>
        </div>
      </div>

      <!-- 设备信息 -->
      <div class="device-card">
        <h3 class="card-title">设备信息</h3>
        <div class="device-info">
          <div class="device-header">
            <van-icon name="desktop-o" />
            <span class="device-name">{{ orderDetail.deviceName }}</span>
          </div>
          <div class="device-location">
            <span>位置：{{ orderDetail.deviceLocation }}</span>
          </div>
        </div>
      </div>

      <!-- 订单信息 -->
      <div class="order-info-card">
        <h3 class="card-title">订单信息</h3>
        <div class="order-details">
          <div class="detail-item">
            <span class="detail-label">订单号</span>
            <span class="detail-value">{{ orderDetail.orderNumber }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">下单时间</span>
            <span class="detail-value">{{ formatFullTime(orderDetail.createdAt) }}</span>
          </div>
          <div class="detail-item" v-if="orderDetail.startTime">
            <span class="detail-label">开始时间</span>
            <span class="detail-value">{{ formatFullTime(orderDetail.startTime) }}</span>
          </div>
          <div class="detail-item" v-if="orderDetail.endTime">
            <span class="detail-label">结束时间</span>
            <span class="detail-value">{{ formatFullTime(orderDetail.endTime) }}</span>
          </div>
          <div class="detail-item" v-if="orderDetail.duration">
            <span class="detail-label">洗车时长</span>
            <span class="detail-value">{{ formatDuration(orderDetail.duration) }}</span>
          </div>
        </div>
      </div>

      <!-- 费用明细 -->
      <div class="payment-card">
        <h3 class="card-title">费用明细</h3>
        <div class="payment-details">
          <div class="payment-item">
            <span class="payment-label">服务费用</span>
            <span class="payment-value">¥{{ orderDetail.servicePrice }}</span>
          </div>
          <div class="payment-item" v-if="(orderDetail.discountAmount || 0) > 0">
            <span class="payment-label">优惠金额</span>
            <span class="payment-value discount">-¥{{ orderDetail.discountAmount }}</span>
          </div>
          <div class="payment-item total">
            <span class="payment-label">实付金额</span>
            <span class="payment-value">¥{{ orderDetail.actualAmount }}</span>
          </div>
          <div class="payment-method">
            <span class="payment-label">支付方式</span>
            <span class="payment-value">{{ getPaymentMethodText(orderDetail.paymentMethod) }}</span>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <van-button 
          v-if="orderDetail.status === 'processing'"
          type="warning"
          size="large"
          @click="cancelOrder"
        >
          取消订单
        </van-button>
        
        <van-button 
          v-if="orderDetail.status === 'completed'"
          type="default"
          size="large"
          @click="reorder"
        >
          再次下单
        </van-button>
        
        <van-button 
          type="primary"
          size="large"
          @click="contactService"
        >
          联系客服
        </van-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <van-loading 
      v-else
      size="24px" 
      vertical
      class="loading-center"
    >
      加载中...
    </van-loading>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showDialog, showSuccessToast } from 'vant'
import { getOrderDetail, cancelOrderApi } from '@/api/order'
import type { OrderDetail } from '@/types'

const route = useRoute()
const router = useRouter()

// 响应式数据
const orderDetail = ref<OrderDetail | null>(null)

// 状态文本映射
const statusTextMap = {
  pending: '待支付',
  processing: '洗车中',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款'
}

// 状态描述映射
const statusDescMap = {
  pending: '请尽快完成支付',
  processing: '设备正在为您服务',
  completed: '洗车服务已完成',
  cancelled: '订单已取消',
  refunded: '费用已退回原支付方式'
}

// 状态图标映射
const statusIconMap = {
  pending: 'clock-o',
  processing: 'play-circle-o',
  completed: 'success',
  cancelled: 'cross',
  refunded: 'refund-o'
}

// 支付方式文本映射
const paymentMethodMap = {
  wechat: '微信支付',
  alipay: '支付宝',
  balance: '余额支付'
}

// 加载订单详情
const loadOrderDetail = async () => {
  const orderId = route.params.id as string
  
  try {
    const response = await getOrderDetail(parseInt(orderId))
    orderDetail.value = response.data
  } catch (error) {
    console.error('加载订单详情失败:', error)
  }
}

// 取消订单
const cancelOrder = async () => {
  if (!orderDetail.value) return

  const result = await showDialog({
    title: '确认取消',
    message: '确定要取消这个订单吗？已消费的费用不会退还。',
    confirmButtonText: '确认取消',
    cancelButtonText: '我再想想'
  })

  if (result !== 'confirm') return

  try {
    await cancelOrderApi(orderDetail.value.id)
    showSuccessToast('订单已取消')
    loadOrderDetail() // 重新加载订单详情
  } catch (error) {
    console.error('取消订单失败:', error)
  }
}

// 重新下单
const reorder = () => {
  if (!orderDetail.value) return
  router.push(`/store/${orderDetail.value.storeId}`)
}

// 联系客服
const contactService = () => {
  showDialog({
    title: '联系客服',
    message: '客服电话：400-123-4567\n工作时间：9:00-21:00',
    confirmButtonText: '拨打电话',
    cancelButtonText: '取消'
  }).then((action) => {
    if (action === 'confirm') {
      window.location.href = 'tel:400-123-4567'
    }
  })
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 获取状态文本
const getStatusText = (status: string) => {
  return statusTextMap[status as keyof typeof statusTextMap] || status
}

// 获取状态描述
const getStatusDescription = (status: string) => {
  return statusDescMap[status as keyof typeof statusDescMap] || ''
}

// 获取状态图标
const getStatusIcon = (status: string) => {
  return statusIconMap[status as keyof typeof statusIconMap] || 'info-o'
}

// 获取支付方式文本
const getPaymentMethodText = (method: string) => {
  return paymentMethodMap[method as keyof typeof paymentMethodMap] || method
}

// 格式化时间
const formatTime = (time: string) => {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  if (diff < 60000) {
    return '刚刚'
  } else if (diff < 3600000) {
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return date.toLocaleDateString()
  }
}

// 格式化完整时间
const formatFullTime = (time: string) => {
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化时长
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}分${secs}秒`
}

// 组件挂载
onMounted(() => {
  loadOrderDetail()
})
</script>

<style scoped>
.order-detail-container {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 20px;
}

.order-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 通用卡片样式 */
.status-card,
.service-card,
.store-card,
.device-card,
.order-info-card,
.payment-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 16px 0;
}

/* 订单状态卡片 */
.status-card {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #1989fa 0%, #1c7cd6 100%);
  color: white;
}

.status-icon {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  margin-right: 16px;
}

.status-icon .van-icon {
  font-size: 28px;
}

.status-info {
  flex: 1;
}

.status-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.status-desc {
  font-size: 14px;
  opacity: 0.9;
  margin: 0 0 4px 0;
}

.order-time {
  font-size: 12px;
  opacity: 0.7;
  margin: 0;
}

/* 服务信息卡片 */
.service-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.service-name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

.service-price {
  font-size: 18px;
  font-weight: 600;
  color: #ee0a24;
}

.service-desc {
  font-size: 14px;
  color: #646566;
  margin: 0 0 12px 0;
}

.service-features {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.feature-tag {
  padding: 2px 8px;
  background: #f2f3f5;
  border-radius: 12px;
  font-size: 12px;
  color: #646566;
}

/* 门店和设备信息 */
.store-info,
.device-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.store-header,
.device-header {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #323233;
}

.store-header .van-icon,
.device-header .van-icon {
  margin-right: 8px;
  color: #1989fa;
}

.store-address,
.store-phone,
.device-location {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #646566;
}

.store-address .van-icon,
.store-phone .van-icon {
  margin-right: 8px;
  color: #969799;
}

/* 订单详情 */
.order-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 14px;
  color: #646566;
}

.detail-value {
  font-size: 14px;
  color: #323233;
  font-weight: 500;
}

/* 费用明细 */
.payment-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.payment-item.total {
  padding-top: 12px;
  border-top: 1px solid #f2f3f5;
  font-weight: 600;
  font-size: 16px;
}

.payment-label {
  font-size: 14px;
  color: #646566;
}

.payment-value {
  font-size: 14px;
  color: #323233;
  font-weight: 500;
}

.payment-value.discount {
  color: #07c160;
}

.payment-method {
  padding-top: 8px;
  border-top: 1px solid #f2f3f5;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.action-buttons .van-button {
  flex: 1;
  border-radius: 12px;
  height: 48px;
}

/* 加载状态 */
.loading-center {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>