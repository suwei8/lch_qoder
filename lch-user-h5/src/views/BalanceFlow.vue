<template>
  <div class="balance-flow-container">
    <van-nav-bar title="余额流水" left-arrow @click-left="$router.go(-1)" />
    
    <!-- 余额概览 -->
    <div class="balance-overview">
      <div class="balance-card">
        <div class="balance-item">
          <div class="balance-label">当前余额</div>
          <div class="balance-amount">¥{{ totalBalance }}</div>
        </div>
        <div class="balance-details">
          <div class="balance-detail">
            <span>账户余额</span>
            <span>¥{{ accountBalance }}</span>
          </div>
          <div class="balance-detail">
            <span>赠送余额</span>
            <span>¥{{ giftBalance }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 交易记录列表 - 按照截图格式 -->
    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-list
        v-model:loading="loading"
        :finished="finished"
        finished-text="没有更多了"
        @load="onLoad"
      >
        <div class="record-list">
          <div 
            v-for="transaction in transactions" 
            :key="transaction.id"
            class="record-item"
          >
            <div class="record-row">
              <span class="record-label">金额：</span>
              <span class="record-amount">{{ formatRecordAmount(transaction.amount) }}</span>
            </div>
            <div class="record-row">
              <span class="record-label">消费时间：</span>
              <span class="record-time">{{ transaction.time }}</span>
            </div>
            <div class="record-row">
              <span class="record-label">详情：</span>
              <span class="record-detail">{{ transaction.description }}</span>
            </div>
          </div>
        </div>
      </van-list>
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showFailToast, showSuccessToast } from 'vant'
import axios from 'axios'

const router = useRouter()

// 余额数据
const totalBalance = ref('0.00')
const accountBalance = ref('0.00')
const giftBalance = ref('0.00')

// 筛选条件
const activeTab = ref('all')
const showDatePicker = ref(false)
const selectedDate = ref([new Date().getFullYear().toString(), (new Date().getMonth() + 1).toString().padStart(2, '0')])

// 交易记录
interface Transaction {
  id: number
  type: string
  amount: number
  description: string
  time: string
  status: string
}

const transactions = ref<Transaction[]>([])

// 分页相关
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const currentPage = ref(1)
const pageSize = ref(20)

// 交易详情弹窗
const showDetailPopup = ref(false)
const selectedTransaction = ref<Transaction | null>(null)

// 筛选后的交易记录
const filteredTransactions = computed(() => {
  if (activeTab.value === 'all') {
    return transactions.value
  }
  return transactions.value.filter((item: Transaction) => {
    if (activeTab.value === 'income') {
      return item.type === 'recharge' || item.type === 'gift'
    } else if (activeTab.value === 'expense') {
      return item.type === 'consumption'
    } else if (activeTab.value === 'recharge') {
      return item.type === 'recharge'
    }
    return true
  })
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

// 获取交易记录
const fetchTransactions = async (page = 1, reset = false) => {
  try {
    loading.value = true
    
    const params: any = {
      page,
      limit: pageSize.value
    }
    
    // 添加类型筛选
    if (activeTab.value !== 'all') {
      if (activeTab.value === 'expense') {
        params.type = 'consumption'
      } else if (activeTab.value === 'recharge') {
        params.type = 'recharge'
      }
    }
    
    const response = await apiRequest.get('/balance-transactions', { params })
    const data = response.data.data
    
    if (reset) {
      transactions.value = []
    }
    
    // 转换数据格式
    const newTransactions = data.items.map((item: any) => ({
      id: item.id,
      type: item.type,
      amount: item.type === 'consumption' ? -(item.amount / 100) : (item.amount / 100),
      description: item.description || `机器编号${item.id.toString().padStart(8, '0')}余额消费${(item.amount / 100).toFixed(2)}元`,
      time: new Date(item.created_at).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-'),
      status: item.status
    }))
    
    if (page === 1) {
      transactions.value = newTransactions
    } else {
      transactions.value.push(...newTransactions)
    }
    
    // 判断是否还有更多数据
    finished.value = data.items.length < pageSize.value || page >= data.totalPages
    currentPage.value = page
    
  } catch (error) {
    console.error('获取交易记录失败:', error)
    showFailToast('获取交易记录失败')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 初始化测试数据
const initTestData = async () => {
  try {
    // 先尝试获取现有数据
    await fetchUserBalance()
    await fetchTransactions(1, true)
    
    // 如果没有数据，则初始化测试数据
    if (transactions.value.length === 0) {
      const userId = 1 // 使用默认用户ID
      await apiRequest.post(`/users/${userId}/balance-transactions/init-test-data`)
      showSuccessToast('测试数据初始化成功')
      await fetchUserBalance()
      await fetchTransactions(1, true)
    }
  } catch (error) {
    console.error('初始化失败:', error)
    // 如果API调用失败，使用模拟数据
    loadMockData()
  }
}

// 加载模拟数据（作为后备方案）
const loadMockData = () => {
  totalBalance.value = '26.46'
  accountBalance.value = '9.35'
  giftBalance.value = '17.11'
  
  transactions.value = [
    {
      id: 1,
      type: 'recharge',
      amount: 50.00,
      description: '微信充值',
      time: '2024-01-15 14:30:25',
      status: 'success'
    },
    {
      id: 2,
      type: 'gift',
      amount: 10.00,
      description: '首次充值赠送',
      time: '2024-01-15 14:30:26',
      status: 'success'
    },
    {
      id: 3,
      type: 'consumption',
      amount: -15.00,
      description: '洗车消费 - 标准洗车',
      time: '2024-01-12 09:15:30',
      status: 'success'
    },
    {
      id: 4,
      type: 'recharge',
      amount: 20.00,
      description: '支付宝充值',
      time: '2024-01-10 16:45:12',
      status: 'success'
    },
    {
      id: 5,
      type: 'consumption',
      amount: -28.00,
      description: '洗车消费 - 精洗套餐',
      time: '2024-01-08 11:20:45',
      status: 'success'
    }
  ]
  finished.value = true
}

// 加载更多
const onLoad = () => {
  if (!finished.value && !loading.value) {
    fetchTransactions(currentPage.value + 1, false)
  }
}

// 下拉刷新
const onRefresh = () => {
  currentPage.value = 1
  finished.value = false
  fetchTransactions(1, true)
}

// 切换筛选类型
const onTabChange = (name: string) => {
  activeTab.value = name
  currentPage.value = 1
  finished.value = false
  fetchTransactions(1, true)
}

// 日期确认
const onDateConfirm = () => {
  showDatePicker.value = false
  // 这里可以根据选择的日期重新加载数据
  currentPage.value = 1
  finished.value = false
  fetchTransactions(1, true)
}

// 显示交易详情
const showTransactionDetail = (transaction: Transaction) => {
  selectedTransaction.value = transaction
  showDetailPopup.value = true
}

// 获取交易图标
const getTransactionIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    recharge: 'plus',
    consumption: 'minus',
    gift: 'gift',
    refund: 'replay',
    withdraw: 'arrow-up'
  }
  return iconMap[type] || 'records'
}

// 获取交易颜色
const getTransactionColor = (type: string) => {
  const colorMap: Record<string, string> = {
    recharge: '#07c160',
    consumption: '#ee0a24',
    gift: '#ff976a',
    refund: '#1989fa',
    withdraw: '#323233'
  }
  return colorMap[type] || '#969799'
}

// 获取金额样式类
const getAmountClass = (type: string) => {
  return type === 'consumption' ? 'expense' : 'income'
}

// 格式化金额 - 按照截图样式，只显示负数
const formatAmount = (amount: number) => {
  if (amount < 0) {
    return Math.abs(amount).toFixed(2)
  }
  return amount.toFixed(2)
}

// 格式化记录金额 - 专门用于记录列表显示
const formatRecordAmount = (amount: number) => {
  if (amount < 0) {
    return Math.abs(amount).toFixed(2)
  }
  return amount.toFixed(2)
}

// 获取交易类型名称
const getTransactionTypeName = (type: string) => {
  const nameMap: Record<string, string> = {
    recharge: '充值',
    consumption: '消费',
    gift: '赠送',
    refund: '退款',
    withdraw: '提现'
  }
  return nameMap[type] || '其他'
}

onMounted(() => {
  initTestData()
})
</script>

<style scoped>
.balance-flow-container {
  min-height: 100vh;
  background: #f8fafc;
  padding-bottom: 20px;
}

.balance-overview {
  padding: 16px;
  background: white;
  margin-bottom: 8px;
}

.balance-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  color: white;
}

.balance-item {
  text-align: center;
  margin-bottom: 16px;
}

.balance-label {
  font-size: 14px;
  opacity: 0.8;
  margin-bottom: 8px;
}

.balance-amount {
  font-size: 32px;
  font-weight: bold;
}

.balance-details {
  display: flex;
  justify-content: space-between;
}

.balance-detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 14px;
}

.balance-detail span:first-child {
  opacity: 0.8;
  margin-bottom: 4px;
}

.balance-detail span:last-child {
  font-weight: bold;
}

.record-list {
  padding: 0;
}

.record-item {
  background: white;
  margin-bottom: 8px;
  padding: 16px;
  border-radius: 0;
}

.record-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
}

.record-row:last-child {
  margin-bottom: 0;
}

.record-label {
  color: #666;
  font-weight: normal;
  min-width: 80px;
}

.record-amount {
  color: #333;
  font-weight: bold;
  font-size: 16px;
}

.record-time {
  color: #666;
  font-size: 14px;
}

.record-detail {
  color: #666;
  font-size: 14px;
  text-align: right;
  flex: 1;
  margin-left: 16px;
}
</style>