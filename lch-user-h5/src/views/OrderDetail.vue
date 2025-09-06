<template>
  <div class="order-detail-container">
    <!-- 导航栏 -->
    <van-nav-bar title="订单详情" left-arrow @click-left="$router.back()" />
    
    <div v-if="isLoading" class="loading-container">
      <van-loading size="24px">加载中...</van-loading>
    </div>
    
    <div v-else-if="order" class="order-detail-content">
      <!-- 订单状态 -->
      <div class="status-card">
        <div class="status-icon" :class="statusClass">
          <van-icon :name="statusIcon" />
        </div>
        <div class="status-info">
          <h2>{{ statusText }}</h2>
          <p class="status-desc">{{ statusDescription }}</p>
        </div>
      </div>
      
      <!-- 选项卡 -->
      <van-tabs v-model:active="activeTab" sticky>
        <van-tab title="订单信息" name="info">
          <order-info-tab :order="order" />
        </van-tab>
        
        <van-tab title="进度详情" name="timeline">
          <order-timeline-tab :timeline="order.timeline || []" />
        </van-tab>
        
        <van-tab 
          v-if="canRefund" 
          title="退款申请" 
          name="refund"
        >
          <order-refund-tab 
            :order="order" 
            @submit-refund="handleRefund"
          />
        </van-tab>
      </van-tabs>
    </div>
    
    <!-- 底部操作按钮 -->
    <div v-if="order" class="bottom-actions">
      <van-button 
        v-if="order.status === 'pending'"
        size="large"
        @click="handleCancel"
      >
        取消订单
      </van-button>
      
      <van-button 
        v-if="order.status === 'pending'"
        type="primary" 
        size="large"
        @click="handlePay"
      >
        立即支付
      </van-button>
      
      <van-button 
        v-if="order.status === 'completed' && !hasRefunded"
        size="large"
        @click="activeTab = 'refund'"
      >
        申请退款
      </van-button>
      
      <van-button 
        v-if="['completed', 'cancelled', 'refunded'].includes(order.status)"
        type="primary" 
        size="large"
        @click="handleReorder"
      >
        再次购买
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ordersApi, type RefundParams } from '@/api/orders'
import type { Order } from '@/types'
import { Toast, Dialog } from 'vant'
import OrderInfoTab from '@/components/OrderInfoTab.vue'
import OrderTimelineTab from '@/components/OrderTimelineTab.vue'
import OrderRefundTab from '@/components/OrderRefundTab.vue'

const route = useRoute()
const router = useRouter()

const isLoading = ref(false)
const order = ref<Order | null>(null)
const activeTab = ref('info')

// 从路由参数获取默认选项卡
if (route.query.tab) {
  activeTab.value = route.query.tab as string
}

// 订单状态相关计算属性
const statusText = computed(() => {
  if (!order.value) return ''
  
  const statusMap = {
    pending: '待支付',
    paid: '已支付',
    using: '使用中',
    completed: '已完成',
    cancelled: '已取消',
    refunding: '退款中',
    refunded: '已退款'
  }
  
  return statusMap[order.value.status as keyof typeof statusMap] || '未知'
})

const statusDescription = computed(() => {
  if (!order.value) return ''
  
  const descMap = {
    pending: '请尽快完成支付',
    paid: '订单支付成功，等待使用',
    using: '设备使用中，请注意安全',
    completed: '订单已完成，感谢您的使用',
    cancelled: '订单已取消',
    refunding: '退款申请已提交，请耐心等待',
    refunded: '退款已完成'
  }
  
  return descMap[order.value.status as keyof typeof descMap] || ''
})

const statusIcon = computed(() => {
  if (!order.value) return 'info-o'
  
  const iconMap = {
    pending: 'clock-o',
    paid: 'checked',
    using: 'play-circle-o',
    completed: 'success',
    cancelled: 'cross',
    refunding: 'refund-o',
    refunded: 'refund-o'
  }
  
  return iconMap[order.value.status as keyof typeof iconMap] || 'info-o'
})

const statusClass = computed(() => {
  if (!order.value) return ''
  
  const classMap = {
    pending: 'status-pending',
    paid: 'status-paid',
    using: 'status-using',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
    refunding: 'status-refunding',
    refunded: 'status-refunded'
  }
  
  return classMap[order.value.status as keyof typeof classMap] || ''
})

const canRefund = computed(() => {
  return order.value?.status === 'completed' && !hasRefunded.value
})

const hasRefunded = computed(() => {
  return ['refunding', 'refunded'].includes(order.value?.status || '')
})

// 加载订单详情
const loadOrderDetail = async () => {
  try {
    isLoading.value = true
    const orderId = route.params.id as string
    order.value = await ordersApi.getOrderDetail(orderId)
  } catch (error) {
    console.error('加载订单详情失败:', error)
    Toast.fail('加载失败')
  } finally {
    isLoading.value = false
  }
}

// 取消订单
const handleCancel = async () => {
  if (!order.value) return
  
  try {
    await Dialog.confirm({
      title: '取消订单',
      message: '确认要取消这个订单吗？',
    })
    
    await ordersApi.cancelOrder(order.value.id)
    Toast.success('订单已取消')
    await loadOrderDetail()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('取消订单失败:', error)
      Toast.fail('取消失败')
    }
  }
}

// 去支付
const handlePay = () => {
  if (!order.value) return
  
  router.push({
    path: '/payment',
    query: { orderId: order.value.id }
  })
}

// 处理退款申请
const handleRefund = async (params: RefundParams) => {
  try {
    await ordersApi.requestRefund(params)
    Toast.success('退款申请已提交')
    await loadOrderDetail()
    activeTab.value = 'timeline'
  } catch (error) {
    console.error('申请退款失败:', error)
    Toast.fail('申请失败')
  }
}

// 再次购买
const handleReorder = async () => {
  if (!order.value) return
  
  try {
    const newOrder = await ordersApi.reorder(order.value.id)
    Toast.success('已为您创建新订单')
    router.push({
      path: '/payment',
      query: { orderId: newOrder.id }
    })
  } catch (error) {
    console.error('再次购买失败:', error)
    Toast.fail('操作失败')
  }
}

onMounted(() => {
  loadOrderDetail()
})
</script>

<style scoped>
.order-detail-container {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 80px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.order-detail-content {
  padding-bottom: 20px;
}

.status-card {
  background: white;
  margin: 12px;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
}

.status-pending {
  background: #fff7e6;
  color: #ff9500;
}

.status-paid,
.status-using {
  background: #e8f4ff;
  color: #1989fa;
}

.status-completed {
  background: #f0f9ff;
  color: #07c160;
}

.status-cancelled {
  background: #f7f8fa;
  color: #969799;
}

.status-refunding,
.status-refunded {
  background: #fff7e6;
  color: #ff9500;
}

.status-info h2 {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 4px;
}

.status-desc {
  font-size: 14px;
  color: #646566;
  margin: 0;
}

.van-tabs {
  background: white;
  margin: 0 12px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 12px 16px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 12px;
}

.bottom-actions .van-button {
  flex: 1;
  height: 44px;
}
</style>