<template>
  <div class="orders-container">
    <!-- 导航栏 -->
    <van-nav-bar title="我的订单" left-arrow @click-left="$router.back()" />
    
    <!-- 状态选项卡 -->
    <van-tabs v-model:active="activeTab" @change="handleTabChange" sticky>
      <van-tab title="全部" name="all" />
      <van-tab title="待支付" name="pending" />
      <van-tab title="使用中" name="using" />
      <van-tab title="已完成" name="completed" />
      <van-tab title="退款/售后" name="refund" />
    </van-tabs>

    <!-- 订单列表 -->
    <div class="orders-content">
      <van-pull-refresh v-model="isRefreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="isLoading"
          :finished="isFinished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <div v-if="orders.length === 0 && !isLoading" class="empty-state">
            <van-empty
              :image="getEmptyImage()"
              :description="getEmptyDescription()"
            />
          </div>
          
          <div v-else>
            <order-item
              v-for="order in orders"
              :key="order.id"
              :order="order"
              @view-detail="handleViewDetail"
              @cancel="handleCancel"
              @pay="handlePay"
              @refund="handleRefund"
              @reorder="handleReorder"
              @delete="handleDelete"
            />
          </div>
        </van-list>
      </van-pull-refresh>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ordersApi, type OrderListParams } from '@/api/orders'
import type { Order } from '@/types'
import { Toast, Dialog } from 'vant'
import OrderItem from '@/components/OrderItem.vue'

const router = useRouter()

// 状态管理
const activeTab = ref('all')
const isLoading = ref(false)
const isRefreshing = ref(false)
const isFinished = ref(false)
const orders = ref<Order[]>([])

// 分页参数
const pagination = reactive({
  page: 1,
  size: 10
})

// 空状态配置
const getEmptyImage = () => {
  const images = {
    all: 'https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png',
    pending: 'https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png',
    using: 'https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png',
    completed: 'https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png',
    refund: 'https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png'
  }
  return images[activeTab.value as keyof typeof images] || images.all
}

const getEmptyDescription = () => {
  const descriptions = {
    all: '暂无订单记录',
    pending: '暂无待支付订单',
    using: '暂无使用中订单',
    completed: '暂无已完成订单',
    refund: '暂无退款订单'
  }
  return descriptions[activeTab.value as keyof typeof descriptions] || descriptions.all
}

// 加载订单列表
const loadOrders = async (isRefresh = false) => {
  try {
    if (isRefresh) {
      pagination.page = 1
      isFinished.value = false
    }
    
    const params: OrderListParams = {
      page: pagination.page,
      size: pagination.size,
      status: activeTab.value === 'all' ? undefined : activeTab.value
    }
    
    const response = await ordersApi.getOrderList(params)
    
    if (isRefresh) {
      orders.value = response.orders
    } else {
      orders.value.push(...response.orders)
    }
    
    isFinished.value = !response.hasMore
    pagination.page++
  } catch (error) {
    console.error('加载订单列表失败:', error)
    Toast.fail('加载失败')
  }
}

// 下拉刷新
const onRefresh = async () => {
  isRefreshing.value = true
  await loadOrders(true)
  isRefreshing.value = false
}

// 上拉加载
const onLoad = async () => {
  if (isRefreshing.value) return
  isLoading.value = true
  await loadOrders()
  isLoading.value = false
}

// 切换选项卡
const handleTabChange = () => {
  orders.value = []
  pagination.page = 1
  isFinished.value = false
  loadOrders(true)
}

// 查看订单详情
const handleViewDetail = (order: Order) => {
  router.push(`/order/${order.id}`)
}

// 取消订单
const handleCancel = async (order: Order) => {
  try {
    await Dialog.confirm({
      title: '取消订单',
      message: '确认要取消这个订单吗？',
    })
    
    await ordersApi.cancelOrder(String(order.id))
    Toast.success('订单已取消')
    onRefresh()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('取消订单失败:', error)
      Toast.fail('取消失败')
    }
  }
}

// 去支付
const handlePay = (order: Order) => {
  router.push({
    path: '/payment',
    query: { orderId: order.id }
  })
}

// 申请退款
const handleRefund = async (order: Order) => {
  router.push(`/order/${order.id}?tab=refund`)
}

// 再次购买
const handleReorder = async (order: Order) => {
  try {
    const newOrder = await ordersApi.reorder(String(order.id))
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

// 删除订单
const handleDelete = async (order: Order) => {
  try {
    await Dialog.confirm({
      title: '删除订单',
      message: '删除后无法恢复，确认要删除这个订单吗？',
    })
    
    await ordersApi.deleteOrder(String(order.id))
    Toast.success('订单已删除')
    onRefresh()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除订单失败:', error)
      Toast.fail('删除失败')
    }
  }
}

onMounted(() => {
  loadOrders(true)
})
</script>

<style scoped>
.orders-container {
  min-height: 100vh;
  background: #f7f8fa;
}

.orders-content {
  padding: 0;
}

.empty-state {
  padding: 60px 20px;
}

.van-tabs {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.van-tabs__wrap) {
  background: white;
}

:deep(.van-tabs__content) {
  background: #f7f8fa;
}

:deep(.van-list) {
  padding: 0;
}
</style>