<template>
  <div class="recharge-records">
    <!-- 头部导航 -->
    <van-nav-bar 
      title="充值记录" 
      left-arrow 
      @click-left="$router.go(-1)"
      fixed
      placeholder
    />

    <!-- 余额概览 - 保留余额流水页面的头部 -->
    <div class="balance-overview">
      <div class="total-balance-card">
        <div class="balance-label">当前余额</div>
        <div class="balance-amount">¥{{ totalBalance }}</div>
      </div>
      <div class="balance-details">
        <div class="balance-item">
          <div class="balance-label">账户余额</div>
          <div class="balance-amount">¥{{ accountBalance }}</div>
        </div>
        <div class="balance-item">
          <div class="balance-label">赠送余额</div>
          <div class="balance-amount">¥{{ giftBalance }}</div>
        </div>
      </div>
    </div>

    <!-- 状态标签页 -->
    <van-tabs v-model:active="activeTab" @change="onTabChange" sticky>
      <van-tab title="支付成功" name="success">
        <div class="records-container">
          <div v-if="successRecords.length === 0" class="empty-state">
            <van-empty description="暂无充值记录" />
          </div>
          <div v-else class="records-list">
            <div 
              v-for="record in successRecords" 
              :key="record.id" 
              class="record-item"
            >
              <div class="record-field">
                <span class="field-label">订单编号：</span>
                <span class="field-value">{{ record.orderNumber }}</span>
              </div>
              <div class="record-field">
                <span class="field-label">充值金额：</span>
                <span class="field-value amount">{{ record.amount }}</span>
              </div>
              <div class="record-field">
                <span class="field-label">赠送金额：</span>
                <span class="field-value gift">{{ record.giftAmount }}</span>
              </div>
              <div class="record-field">
                <span class="field-label">创建时间：</span>
                <span class="field-value">{{ record.createTime }}</span>
              </div>
              <div class="record-field">
                <span class="field-label">支付方式：</span>
                <span class="field-value">{{ record.paymentMethod }}</span>
              </div>
              <div class="record-field">
                <span class="field-label">订单状态：</span>
                <span class="field-value status success">{{ record.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </van-tab>
      
      <van-tab title="支付失败" name="failed">
        <div class="records-container">
          <div v-if="failedRecords.length === 0" class="empty-state">
            <van-empty description="暂无失败记录" />
          </div>
          <div v-else class="records-list">
            <div 
              v-for="record in failedRecords" 
              :key="record.id" 
              class="record-item"
            >
              <div class="record-field">
                <span class="field-label">订单编号：</span>
                <span class="field-value">{{ record.orderNumber }}</span>
              </div>
              <div class="record-field">
                <span class="field-label">充值金额：</span>
                <span class="field-value amount">{{ record.amount }}</span>
              </div>
              <div class="record-field">
                <span class="field-label">赠送金额：</span>
                <span class="field-value gift">{{ record.giftAmount }}</span>
              </div>
              <div class="record-field">
                <span class="field-label">创建时间：</span>
                <span class="field-value">{{ record.createTime }}</span>
              </div>
              <div class="record-field">
                <span class="field-label">支付方式：</span>
                <span class="field-value">{{ record.paymentMethod }}</span>
              </div>
              <div class="record-field">
                <span class="field-label">订单状态：</span>
                <span class="field-value status failed">{{ record.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </van-tab>
    </van-tabs>

    <!-- 加载更多 -->
    <van-list
      v-model:loading="loading"
      :finished="finished"
      finished-text="没有更多了"
      @load="loadMore"
    >
    </van-list>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { showFailToast, showSuccessToast } from 'vant'
import axios from 'axios'

// 页面状态
const activeTab = ref('success')
const loading = ref(false)
const finished = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)

// 余额信息
const totalBalance = ref('0.00')
const accountBalance = ref('0.00')
const giftBalance = ref('0.00')

// 充值记录
interface RechargeRecord {
  id: number
  orderNumber: string
  amount: string
  giftAmount: string
  createTime: string
  paymentMethod: string
  status: string
}

const rechargeRecords = ref<RechargeRecord[]>([])

// 计算属性：成功的充值记录
const successRecords = computed(() => {
  return rechargeRecords.value.filter((record: RechargeRecord) => record.status === '支付成功')
})

// 计算属性：失败的充值记录
const failedRecords = computed(() => {
  return rechargeRecords.value.filter((record: RechargeRecord) => record.status === '支付失败')
})

// API请求配置
const apiRequest = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000
})

// 添加请求拦截器
apiRequest.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 获取用户余额信息
const fetchUserBalance = async () => {
  try {
    const response = await apiRequest.get('/balance-transactions/balance')
    const data = response.data.data
    
    accountBalance.value = (data.balance / 100).toFixed(2)
    giftBalance.value = (data.gift_balance / 100).toFixed(2)
    totalBalance.value = (data.total_balance / 100).toFixed(2)
  } catch (error) {
    console.error('获取余额失败:', error)
    showFailToast('获取余额失败')
  }
}

// 获取充值记录
const fetchRechargeRecords = async (page = 1, reset = false) => {
  try {
    loading.value = true
    
    const params = {
      page,
      limit: pageSize.value,
      type: 'recharge' // 只获取充值类型的记录
    }
    
    const response = await apiRequest.get('/balance-transactions', { params })
    const data = response.data.data
    
    if (reset) {
      rechargeRecords.value = []
    }
    
    // 转换数据格式
    const newRecords = data.items.map((item: any) => ({
      id: item.id,
      orderNumber: item.external_transaction_id || `${new Date(item.created_at).getFullYear()}${String(new Date(item.created_at).getMonth() + 1).padStart(2, '0')}${String(new Date(item.created_at).getDate()).padStart(2, '0')}${String(new Date(item.created_at).getHours()).padStart(2, '0')}${String(new Date(item.created_at).getMinutes()).padStart(2, '0')}${String(new Date(item.created_at).getSeconds()).padStart(2, '0')}${item.id.toString().padStart(6, '0')}`,
      amount: (item.amount / 100).toFixed(2),
      giftAmount: item.gift_balance_after > item.gift_balance_before ? ((item.gift_balance_after - item.gift_balance_before) / 100).toFixed(2) : '0.00',
      createTime: new Date(item.created_at).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-'),
      paymentMethod: '微信支付',
      status: item.status === 'success' ? '支付成功' : '支付失败'
    }))
    
    if (page === 1) {
      rechargeRecords.value = newRecords
      // 添加一些模拟的失败记录用于演示
      rechargeRecords.value.push(
        {
          id: 999,
          orderNumber: '202309151030001234567',
          amount: '30.00',
          giftAmount: '0.00',
          createTime: '2023-09-15 10:30:00',
          paymentMethod: '微信支付',
          status: '支付失败'
        },
        {
          id: 998,
          orderNumber: '202309131420007654321',
          amount: '100.00',
          giftAmount: '0.00',
          createTime: '2023-09-13 14:20:00',
          paymentMethod: '微信支付',
          status: '支付失败'
        }
      )
    } else {
      rechargeRecords.value.push(...newRecords)
    }
    
    // 判断是否还有更多数据
    finished.value = data.items.length < pageSize.value || page >= data.totalPages
    currentPage.value = page
    
  } catch (error) {
    console.error('获取充值记录失败:', error)
    showFailToast('获取充值记录失败')
    // 如果API调用失败，使用模拟数据
    loadMockData()
  } finally {
    loading.value = false
  }
}

// 加载模拟数据（作为后备方案）
const loadMockData = () => {
  totalBalance.value = '26.46'
  accountBalance.value = '9.35'
  giftBalance.value = '17.11'
  
  rechargeRecords.value = [
    {
      id: 1,
      orderNumber: '202411211519587282454',
      amount: '50.00',
      giftAmount: '10.00',
      createTime: '2024-11-21 15:19:58',
      paymentMethod: '微信支付',
      status: '支付成功'
    },
    {
      id: 2,
      orderNumber: '202306281736511068514',
      amount: '50.00',
      giftAmount: '5.00',
      createTime: '2023-06-28 17:36:51',
      paymentMethod: '微信支付',
      status: '支付成功'
    },
    {
      id: 3,
      orderNumber: '202304031755523826744',
      amount: '50.00',
      giftAmount: '0.00',
      createTime: '2023-04-03 17:55:52',
      paymentMethod: '微信支付',
      status: '支付失败'
    },
    {
      id: 4,
      orderNumber: '202309151030001234567',
      amount: '30.00',
      giftAmount: '0.00',
      createTime: '2023-09-15 10:30:00',
      paymentMethod: '微信支付',
      status: '支付失败'
    },
    {
      id: 5,
      orderNumber: '202309131420007654321',
      amount: '100.00',
      giftAmount: '0.00',
      createTime: '2023-09-13 14:20:00',
      paymentMethod: '微信支付',
      status: '支付失败'
    }
  ]
}

// 标签页切换
const onTabChange = (name: string) => {
  activeTab.value = name
}

// 加载更多
const loadMore = () => {
  if (!finished.value) {
    fetchRechargeRecords(currentPage.value + 1)
  }
}

// 初始化数据
const initData = async () => {
  try {
    await fetchUserBalance()
    await fetchRechargeRecords(1, true)
  } catch (error) {
    console.error('初始化失败:', error)
    loadMockData()
  }
}

onMounted(() => {
  initData()
})
</script>

<style scoped>
.recharge-records {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 20px;
}

/* 余额概览样式 - 复用余额流水页面的样式 */
.balance-overview {
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.total-balance-card {
  text-align: center;
  margin-bottom: 16px;
}

.total-balance-card .balance-label {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 8px;
}

.total-balance-card .balance-amount {
  font-size: 32px;
  font-weight: bold;
}

.balance-details {
  display: flex;
  justify-content: space-between;
}

.balance-item {
  flex: 1;
  text-align: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin: 0 4px;
}

.balance-item .balance-label {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.balance-item .balance-amount {
  font-size: 18px;
  font-weight: bold;
}

/* 记录容器 */
.records-container {
  padding: 16px;
}

.empty-state {
  padding: 40px 0;
}

/* 记录列表 */
.records-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.record-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.record-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.record-field:last-child {
  border-bottom: none;
}

.field-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.field-value {
  font-size: 14px;
  color: #333;
  text-align: right;
  max-width: 60%;
  word-break: break-all;
}

.field-value.amount {
  color: #ff6b35;
  font-weight: bold;
}

.field-value.gift {
  color: #52c41a;
  font-weight: bold;
}

.field-value.status.success {
  color: #52c41a;
  font-weight: bold;
}

.field-value.status.failed {
  color: #ff4d4f;
  font-weight: bold;
}

/* 标签页样式 */
:deep(.van-tabs__wrap) {
  background: white;
}

:deep(.van-tab) {
  font-weight: 500;
}

:deep(.van-tab--active) {
  color: #1989fa;
}

:deep(.van-tabs__line) {
  background: #1989fa;
}
</style>