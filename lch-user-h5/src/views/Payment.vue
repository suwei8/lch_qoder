<template>
  <div class="payment-container">
    <!-- 导航栏 -->
    <van-nav-bar
      title="订单支付"
      left-arrow
      @click-left="handleBack"
    />

    <div v-if="order" class="payment-content">
      <!-- 订单信息 -->
      <div class="order-info-card">
        <div class="order-header">
          <h3>{{ order.storeName }}</h3>
          <p class="device-name">{{ order.deviceName }}</p>
        </div>
        
        <div class="order-details">
          <div class="detail-item">
            <span class="label">服务类型：</span>
            <span class="value">自助洗车</span>
          </div>
          
          <div class="detail-item">
            <span class="label">预计费用：</span>
            <span class="value price">¥{{ order.amount.toFixed(2) }}</span>
          </div>
          
          <div v-if="order.couponId" class="detail-item">
            <span class="label">优惠券：</span>
            <span class="value discount">-¥{{ (order.discountAmount || 0).toFixed(2) }}</span>
          </div>
        </div>
        
        <div class="total-amount">
          <span class="label">实付金额：</span>
          <span class="amount">¥{{ order.payAmount.toFixed(2) }}</span>
        </div>
      </div>

      <!-- 优惠券选择 -->
      <div class="coupon-section">
        <div class="section-header" @click="showCouponSelector = true">
          <span>优惠券</span>
          <div class="coupon-info">
            <span v-if="selectedCoupon" class="selected-coupon">
              {{ selectedCoupon.name }} -¥{{ getCouponDiscount(selectedCoupon) }}
            </span>
            <span v-else class="no-coupon">选择优惠券</span>
            <van-icon name="arrow" />
          </div>
        </div>
      </div>

      <!-- 支付方式选择 -->
      <div class="payment-methods">
        <h4>支付方式</h4>
        
        <div class="method-list">
          <!-- 微信支付 -->
          <div 
            class="method-item"
            :class="{ active: paymentMethod === 'wechat' }"
            @click="selectPaymentMethod('wechat')"
          >
            <div class="method-icon wechat">
              <van-icon name="wechat-pay" />
            </div>
            <div class="method-info">
              <span class="method-name">微信支付</span>
              <span class="method-desc">推荐使用</span>
            </div>
            <van-radio :model-value="paymentMethod === 'wechat'" />
          </div>

          <!-- 余额支付 -->
          <div 
            class="method-item"
            :class="{ 
              active: paymentMethod === 'balance',
              disabled: userStore.user!.balance < order.payAmount
            }"
            @click="selectPaymentMethod('balance')"
          >
            <div class="method-icon balance">
              <van-icon name="gold-coin-o" />
            </div>
            <div class="method-info">
              <span class="method-name">余额支付</span>
              <span class="method-desc">
                余额：¥{{ userStore.user!.balance.toFixed(2) }}
                <span v-if="userStore.user!.balance < order.payAmount" class="insufficient">
                  (余额不足)
                </span>
              </span>
            </div>
            <van-radio 
              :model-value="paymentMethod === 'balance'"
              :disabled="userStore.user!.balance < order.payAmount"
            />
          </div>

          <!-- 赠送余额支付 -->
          <div 
            v-if="userStore.user!.giftBalance > 0"
            class="method-item"
            :class="{ 
              active: paymentMethod === 'gift',
              disabled: userStore.user!.giftBalance < order.payAmount
            }"
            @click="selectPaymentMethod('gift')"
          >
            <div class="method-icon gift">
              <van-icon name="gift-o" />
            </div>
            <div class="method-info">
              <span class="method-name">赠送余额</span>
              <span class="method-desc">
                赠送余额：¥{{ userStore.user!.giftBalance.toFixed(2) }}
                <span v-if="userStore.user!.giftBalance < order.payAmount" class="insufficient">
                  (余额不足)
                </span>
              </span>
            </div>
            <van-radio 
              :model-value="paymentMethod === 'gift'"
              :disabled="userStore.user!.giftBalance < order.payAmount"
            />
          </div>
        </div>
      </div>

      <!-- 支付协议 -->
      <div class="payment-agreement">
        <van-checkbox v-model="agreeTerms">
          我已阅读并同意
          <span class="terms-link">《服务协议》</span>
          和
          <span class="terms-link">《隐私政策》</span>
        </van-checkbox>
      </div>
    </div>

    <!-- 底部支付按钮 -->
    <div class="payment-footer">
      <div class="amount-info">
        <span class="label">实付：</span>
        <span class="amount">¥{{ order?.payAmount.toFixed(2) || '0.00' }}</span>
      </div>
      
      <van-button 
        type="primary" 
        size="large"
        class="pay-btn"
        :loading="isPaymentLoading"
        :disabled="!agreeTerms || !paymentMethod"
        @click="handlePayment"
      >
        立即支付
      </van-button>
    </div>

    <!-- 优惠券选择弹窗 -->
    <van-popup 
      v-model:show="showCouponSelector"
      position="bottom"
      :style="{ height: '60%' }"
    >
      <div class="coupon-selector">
        <div class="selector-header">
          <h3>选择优惠券</h3>
          <van-icon name="cross" @click="showCouponSelector = false" />
        </div>
        
        <div class="coupon-list">
          <div 
            class="coupon-item"
            :class="{ selected: !selectedCoupon }"
            @click="selectCoupon(null)"
          >
            <span>不使用优惠券</span>
            <van-radio :model-value="!selectedCoupon" />
          </div>
          
          <div 
            v-for="coupon in availableCoupons"
            :key="coupon.id"
            class="coupon-item"
            :class="{ 
              selected: selectedCoupon?.id === coupon.id,
              disabled: !canUseCoupon(coupon)
            }"
            @click="selectCoupon(coupon)"
          >
            <div class="coupon-info">
              <h4>{{ coupon.name }}</h4>
              <p v-if="coupon.type === 'discount'">
                {{ (coupon.value * 10).toFixed(1) }}折优惠
              </p>
              <p v-else>
                满{{ coupon.minAmount }}减{{ coupon.value }}
              </p>
              <p class="coupon-validity">有效期至 {{ coupon.validUntil }}</p>
            </div>
            
            <div class="coupon-value">
              <span v-if="coupon.type === 'discount'">
                {{ (coupon.value * 10).toFixed(1) }}折
              </span>
              <span v-else>
                ¥{{ coupon.value }}
              </span>
            </div>
            
            <van-radio 
              :model-value="selectedCoupon?.id === coupon.id"
              :disabled="!canUseCoupon(coupon)"
            />
          </div>
        </div>
      </div>
    </van-popup>

    <!-- 支付中弹窗 -->
    <van-dialog
      v-model:show="showPaymentDialog"
      title="支付处理中"
      :show-cancel-button="false"
      :close-on-click-overlay="false"
    >
      <div class="payment-processing">
        <van-loading size="24px" />
        <p>{{ paymentDialogText }}</p>
      </div>
    </van-dialog>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <van-loading size="24px">加载订单信息...</van-loading>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { paymentApi } from '@/api/payment'
import type { Order, Coupon } from '@/types'
import { Toast, Dialog } from 'vant'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 响应式数据
const order = ref<Order | null>(null)
const paymentMethod = ref<'wechat' | 'balance' | 'gift'>('wechat')
const agreeTerms = ref(false)
const isLoading = ref(true)
const isPaymentLoading = ref(false)
const showCouponSelector = ref(false)
const showPaymentDialog = ref(false)
const paymentDialogText = ref('')
const selectedCoupon = ref<Coupon | null>(null)
const availableCoupons = ref<Coupon[]>([])

// 计算属性
const canPay = computed(() => {
  if (!order.value || !paymentMethod.value || !agreeTerms.value) return false
  
  if (paymentMethod.value === 'balance') {
    return userStore.user!.balance >= order.value.payAmount
  }
  
  if (paymentMethod.value === 'gift') {
    return userStore.user!.giftBalance >= order.value.payAmount
  }
  
  return true
})

// 创建模拟订单数据
const createMockOrder = (): Order => {
  const storeId = Number(route.query.storeId) || 1
  const deviceId = Number(route.query.deviceId) || 1
  const baseAmount = 15.00
  
  return {
    id: Date.now(),
    orderNo: `LCH${Date.now()}`,
    userId: userStore.user!.id,
    storeId,
    deviceId,
    storeName: '北京朝阳大悦城洗车点',
    deviceName: '1号洗车机',
    amount: baseAmount,
    payAmount: baseAmount,
    discountAmount: 0,
    paymentMethod: 'wechat',
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

// 获取模拟优惠券数据
const getMockCoupons = (): Coupon[] => {
  return [
    {
      id: 1,
      name: '新人专享券',
      type: 'reduce',
      value: 5,
      minAmount: 10,
      validFrom: '2024-01-01',
      validTo: '2024-12-31',
      description: '新用户专享优惠',
      isNewUser: true,
      status: 'unused'
    },
    {
      id: 2,
      name: '周末特惠券',
      type: 'discount',
      value: 0.85,
      minAmount: 0,
      validFrom: '2024-01-01',
      validTo: '2024-12-31',
      description: '周末8.5折优惠',
      isNewUser: false,
      status: 'unused'
    }
  ]
}

// 检查优惠券是否可用
const canUseCoupon = (coupon: Coupon): boolean => {
  if (!order.value) return false
  
  // 检查最低消费
  if (order.value.amount < coupon.minAmount) return false
  
  // 检查新人专享
  if (coupon.isNewUser && userStore.user!.id !== 1) return false
  
  return true
}

// 计算优惠券折扣金额
const getCouponDiscount = (coupon: Coupon): number => {
  if (!order.value) return 0
  
  if (coupon.type === 'discount') {
    return order.value.amount * (1 - coupon.value)
  } else {
    return Math.min(coupon.value, order.value.amount)
  }
}

// 选择支付方式
const selectPaymentMethod = (method: 'wechat' | 'balance' | 'gift') => {
  if (method === 'balance' && userStore.user!.balance < order.value!.payAmount) {
    Toast.fail('余额不足')
    return
  }
  
  if (method === 'gift' && userStore.user!.giftBalance < order.value!.payAmount) {
    Toast.fail('赠送余额不足')
    return
  }
  
  paymentMethod.value = method
}

// 选择优惠券
const selectCoupon = (coupon: Coupon | null) => {
  if (coupon && !canUseCoupon(coupon)) {
    Toast.fail('该优惠券不可用')
    return
  }
  
  selectedCoupon.value = coupon
  
  if (order.value) {
    if (coupon) {
      const discount = getCouponDiscount(coupon)
      order.value.discountAmount = discount
      order.value.payAmount = order.value.amount - discount
      order.value.couponId = coupon.id
    } else {
      order.value.discountAmount = 0
      order.value.payAmount = order.value.amount
      order.value.couponId = undefined
    }
  }
  
  showCouponSelector.value = false
}

// 处理支付
const handlePayment = async () => {
  if (!canPay.value || !order.value) return
  
  try {
    isPaymentLoading.value = true
    showPaymentDialog.value = true
    
    if (paymentMethod.value === 'wechat') {
      await handleWechatPayment()
    } else if (paymentMethod.value === 'balance') {
      await handleBalancePayment()
    } else if (paymentMethod.value === 'gift') {
      await handleGiftPayment()
    }
  } catch (error) {
    console.error('支付失败:', error)
    Toast.fail('支付失败，请重试')
  } finally {
    isPaymentLoading.value = false
    showPaymentDialog.value = false
  }
}

// 微信支付
const handleWechatPayment = async () => {
  paymentDialogText.value = '正在调起微信支付...'
  
  // 模拟微信支付流程
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  if (typeof window !== 'undefined' && (window as any).wx) {
    // 实际微信支付调用
    const wx = (window as any).wx
    
    try {
      // 获取微信支付配置
      const payConfig = await paymentApi.getWechatPayConfig({
        orderId: order.value!.id
      })
      
      wx.chooseWXPay({
        ...payConfig,
        success: () => {
          handlePaymentSuccess()
        },
        fail: () => {
          throw new Error('微信支付失败')
        }
      })
    } catch (error) {
      // 模拟支付成功
      await new Promise(resolve => setTimeout(resolve, 1000))
      handlePaymentSuccess()
    }
  } else {
    // 非微信环境，模拟支付成功
    await new Promise(resolve => setTimeout(resolve, 1000))
    handlePaymentSuccess()
  }
}

// 余额支付
const handleBalancePayment = async () => {
  paymentDialogText.value = '正在扣除余额...'
  
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // 更新用户余额
  const newBalance = userStore.user!.balance - order.value!.payAmount
  userStore.updateBalance(newBalance, userStore.user!.giftBalance)
  
  handlePaymentSuccess()
}

// 赠送余额支付
const handleGiftPayment = async () => {
  paymentDialogText.value = '正在扣除赠送余额...'
  
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  // 更新用户赠送余额
  const newGiftBalance = userStore.user!.giftBalance - order.value!.payAmount
  userStore.updateBalance(userStore.user!.balance, newGiftBalance)
  
  handlePaymentSuccess()
}

// 支付成功处理
const handlePaymentSuccess = () => {
  Toast.success('支付成功')
  
  // 跳转到设备控制页面
  router.replace({
    path: `/device/${order.value!.storeId}/${order.value!.deviceId}`,
    query: { orderId: order.value!.id }
  })
}

// 返回处理
const handleBack = async () => {
  try {
    await Dialog.confirm({
      title: '确认离开',
      message: '离开将取消当前订单，确定要离开吗？'
    })
    
    router.back()
  } catch {
    // 用户取消
  }
}

// 加载订单信息
const loadOrderInfo = async () => {
  try {
    isLoading.value = true
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    order.value = createMockOrder()
    availableCoupons.value = getMockCoupons()
  } catch (error) {
    console.error('加载订单信息失败:', error)
    Toast.fail('加载失败')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadOrderInfo()
})
</script>

<style scoped>
.payment-container {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 80px;
}

.payment-content {
  padding: 16px;
}

.order-info-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.order-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 4px;
}

.device-name {
  font-size: 14px;
  color: #646566;
  margin: 0 0 16px;
}

.order-details {
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
}

.detail-item .label {
  color: #646566;
}

.detail-item .value {
  color: #323233;
}

.detail-item .price {
  color: #1989fa;
  font-weight: 600;
}

.detail-item .discount {
  color: #07c160;
  font-weight: 600;
}

.total-amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #eee;
  font-size: 16px;
}

.total-amount .label {
  color: #323233;
  font-weight: 600;
}

.total-amount .amount {
  color: #ee0a24;
  font-size: 20px;
  font-weight: 600;
}

.coupon-section {
  background: white;
  border-radius: 12px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  cursor: pointer;
}

.coupon-info {
  display: flex;
  align-items: center;
  color: #646566;
  font-size: 14px;
  font-weight: 400;
}

.selected-coupon {
  color: #07c160;
  margin-right: 8px;
}

.no-coupon {
  margin-right: 8px;
}

.payment-methods {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.payment-methods h4 {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 16px;
}

.method-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.method-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #ebedf0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.method-item.active {
  border-color: #1989fa;
  background: #f8fafe;
}

.method-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.method-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 20px;
  color: white;
}

.method-icon.wechat {
  background: #07c160;
}

.method-icon.balance {
  background: #ff976a;
}

.method-icon.gift {
  background: #722ed1;
}

.method-info {
  flex: 1;
}

.method-name {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 4px;
}

.method-desc {
  font-size: 12px;
  color: #646566;
}

.insufficient {
  color: #ee0a24;
}

.payment-agreement {
  background: white;
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.terms-link {
  color: #1989fa;
}

.payment-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 16px 20px;
  border-top: 1px solid #eee;
  display: flex;
  align-items: center;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.amount-info {
  flex: 1;
}

.amount-info .label {
  font-size: 14px;
  color: #646566;
}

.amount-info .amount {
  font-size: 20px;
  font-weight: 600;
  color: #ee0a24;
  margin-left: 8px;
}

.pay-btn {
  width: 120px;
  height: 44px;
  border-radius: 22px;
  font-size: 16px;
  font-weight: 600;
}

.coupon-selector {
  padding: 20px;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.selector-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

.coupon-list {
  max-height: 400px;
  overflow-y: auto;
}

.coupon-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #ebedf0;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
}

.coupon-item.selected {
  border-color: #1989fa;
  background: #f8fafe;
}

.coupon-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.coupon-info {
  flex: 1;
}

.coupon-info h4 {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 4px;
}

.coupon-info p {
  font-size: 12px;
  color: #646566;
  margin: 0 0 2px;
}

.coupon-validity {
  color: #969799;
}

.coupon-value {
  margin-right: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #ee0a24;
}

.payment-processing {
  text-align: center;
  padding: 20px;
}

.payment-processing p {
  margin: 16px 0 0;
  color: #646566;
}

.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 9999;
}
</style>