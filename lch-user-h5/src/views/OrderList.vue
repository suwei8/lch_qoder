<template>
  <div class="order-list-container">
    <!-- 导航栏 -->
    <van-nav-bar title="我的订单" left-arrow @click-left="goBack" />

    <!-- 订单状态标签 -->
    <van-tabs v-model:active="activeTab" @change="onTabChange" sticky>
      <van-tab title="全部" name="all" />
      <van-tab title="进行中" name="processing" />
      <van-tab title="已完成" name="completed" />
      <van-tab title="已取消" name="cancelled" />
    </van-tabs>

    <!-- 订单列表 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div class="order-list">
          <div 
            v-for="order in orderList" 
            :key="order.id"
            class="order-card"
            @click="goToOrderDetail(order.id)"
          >
            <div class="order-header">
              <div class="order-info">
                <span class="order-number">订单号：{{ order.orderNumber }}</span>
                <span class="order-time">{{ formatTime(order.createdAt) }}</span>
              </div>
              <div class="order-status" :class="order.status">
                {{ getStatusText(order.status) }}
              </div>
            </div>

            <div class="order-content">
              <div class="store-info">
                <van-icon name="shop-o" />
                <span class="store-name">{{ order.storeName }}</span>
              </div>
              
              <div class="service-info">
                <h4 class="service-name">{{ order.serviceName }}</h4>
                <p class="service-desc">{{ order.serviceDescription }}</p>
              </div>

              <div class="order-meta">
                <div class="device-info">
                  <van-icon name="desktop-o" />
                  <span>{{ order.deviceName }}</span>
                </div>
                <div class="order-amount">
                  <span class="amount-label">实付</span>
                  <span class="amount-value">¥{{ order.actualAmount }}</span>
                </div>
              </div>
            </div>

            <div class="order-actions">
              <van-button 
                v-if="order.status === 'processing'"
                type="warning"
                size="small"
                @click.stop="cancelOrder(order.id)"
              >
                取消订单
              </van-button>
              
              <van-button 
                v-if="order.status === 'completed'"
                type="default"
                size="small"
                @click.stop="reorder(order)"
              >
                再次下单
              </van-button>
              
              <van-button 
                type="primary"
                size="small"
                @click.stop="goToOrderDetail(order.id)"
              >
                查看详情
              </van-button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <van-empty 
          v-if="!loading && orderList.length === 0"
          description="暂无订单"
          image="search"
        />
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showDialog, showSuccessToast } from 'vant'
import { getOrderList, cancelOrderApi } from '@/api/order'
import type { Order } from '@/types'

const router = useRouter()

// 响应式数据
const activeTab = ref('all')
const orderList = ref<Order[]>([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const currentPage = ref(1)

// 状态文本映射
const statusTextMap = {
  pending: '待支付',
  processing: '进行中',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款'
}

// 加载订单列表
const loadOrders = async (reset = false) => {
  if (reset) {
    currentPage.value = 1
    finished.value = false
    orderList.value = []
  }

  try {
    const response = await getOrderList({
      page: currentPage.value,
      limit: 10,
      status: activeTab.value === 'all' ? undefined : activeTab.value
    })

    const newOrders = (response as any)?.data || []

    if (reset) {
      orderList.value = newOrders
    } else {
      orderList.value.push(...newOrders)
    }

    if (newOrders.length < 10) {
      finished.value = true
    }

    currentPage.value++
  } catch (error) {
    console.error('加载订单列表失败:', error)
  }
}

// 标签切换
const onTabChange = () => {
  loadOrders(true)
}

// 下拉刷新
const onRefresh = async () => {
  await loadOrders(true)
  refreshing.value = false
}

// 上拉加载
const onLoad = async () => {
  await loadOrders()
  loading.value = false
}

// 取消订单
const cancelOrder = async (orderId: number) => {
  const result = await showDialog({
    title: '确认取消',
    message: '确定要取消这个订单吗？',
    confirmButtonText: '确认取消',
    cancelButtonText: '我再想想'
  })

  if (result !== 'confirm') return

  try {
    await cancelOrderApi(orderId)
    showSuccessToast('订单已取消')
    loadOrders(true)
  } catch (error) {
    console.error('取消订单失败:', error)
  }
}

// 重新下单
const reorder = (order: Order) => {
  router.push(`/store/${order.storeId}`)
}

// 跳转到订单详情
const goToOrderDetail = (orderId: number) => {
  router.push(`/order/${orderId}`)
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 获取状态文本
const getStatusText = (status: string) => {
  return statusTextMap[status as keyof typeof statusTextMap] || status
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

// 组件挂载
onMounted(() => {
  loadOrders(true)
})
</script>

<style scoped>
.order-list-container {
  min-height: 100vh;
  background: #f7f8fa;
}

.order-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: transform 0.2s ease;
}

.order-card:active {
  transform: scale(0.98);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.order-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.order-number {
  font-size: 14px;
  color: #323233;
  font-weight: 500;
}

.order-time {
  font-size: 12px;
  color: #969799;
}

.order-status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.order-status.pending {
  background: #fff7e6;
  color: #ff976a;
}

.order-status.processing {
  background: #e6f7ff;
  color: #1989fa;
}

.order-status.completed {
  background: #f0f9ff;
  color: #07c160;
}

.order-status.cancelled {
  background: #fef0f0;
  color: #ee0a24;
}

.order-content {
  margin-bottom: 16px;
}

.store-info {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.store-info .van-icon {
  margin-right: 6px;
  color: #1989fa;
}

.store-name {
  font-size: 14px;
  color: #646566;
}

.service-info {
  margin-bottom: 12px;
}

.service-name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 4px 0;
}

.service-desc {
  font-size: 12px;
  color: #969799;
  margin: 0;
}

.order-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.device-info {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #646566;
}

.device-info .van-icon {
  margin-right: 4px;
}

.order-amount {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.amount-label {
  font-size: 12px;
  color: #969799;
}

.amount-value {
  font-size: 18px;
  font-weight: 600;
  color: #ee0a24;
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>