<template>
  <div class="recharge-container">
    <!-- 导航栏 -->
    <van-nav-bar title="充值中心" left-arrow @click-left="$router.back()" />
    
    <div v-if="isLoading" class="loading-container">
      <van-loading size="24px">加载中...</van-loading>
    </div>
    
    <div v-else class="recharge-content">
      <!-- 用户余额信息 -->
      <div class="balance-card">
        <div class="balance-header">
          <h3>我的余额</h3>
          <van-button size="small" type="primary" plain @click="showRecords = true">
            充值记录
          </van-button>
        </div>
        
        <div class="balance-info">
          <div class="balance-item">
            <div class="balance-amount">¥{{ userBalance.toFixed(2) }}</div>
            <div class="balance-label">余额</div>
          </div>
          
          <div class="balance-divider"></div>
          
          <div class="balance-item">
            <div class="balance-amount gift">¥{{ userGiftBalance.toFixed(2) }}</div>
            <div class="balance-label">赠送余额</div>
          </div>
        </div>
      </div>

      <!-- 充值套餐 -->
      <div class="packages-section">
        <h3 class="section-title">选择充值套餐</h3>
        
        <div class="packages-grid">
          <div 
            v-for="pkg in packages" 
            :key="pkg.id"
            class="package-item"
            :class="{ 
              selected: selectedPackage?.id === pkg.id,
              recommended: pkg.isRecommended,
              popular: pkg.isPopular
            }"
            @click="selectPackage(pkg)"
          >
            <!-- 标签 -->
            <div v-if="pkg.isRecommended" class="package-badge recommended">推荐</div>
            <div v-if="pkg.isPopular" class="package-badge popular">热门</div>
            
            <div class="package-content">
              <div class="package-title">{{ pkg.name }}</div>
              
              <div class="package-amounts">
                <div class="main-amount">¥{{ pkg.amount }}</div>
                <div v-if="pkg.giftAmount > 0" class="gift-amount">
                  +赠{{ pkg.giftAmount }}元
                </div>
              </div>
              
              <div class="package-total">
                实得¥{{ pkg.totalAmount }}
              </div>
              
              <div v-if="pkg.description" class="package-desc">
                {{ pkg.description }}
              </div>
            </div>
            
            <div class="package-select">
              <van-radio :model-value="selectedPackage?.id === pkg.id" />
            </div>
          </div>
        </div>
      </div>

      <!-- 自定义充值 -->
      <div class="custom-recharge">
        <h3 class="section-title">自定义充值</h3>
        
        <div class="custom-input">
          <van-field
            v-model="customAmount"
            type="number"
            placeholder="请输入充值金额"
            :rules="[{ required: true, message: '请输入充倽金额' }]"
          >
            <template #left-icon>
              <span class="amount-symbol">¥</span>
            </template>
            <template #button>
              <van-button 
                size="small" 
                type="primary"
                :disabled="!isValidCustomAmount"
                @click="selectCustomAmount"
              >
                选择
              </van-button>
            </template>
          </van-field>
          
          <div class="custom-note">
            <van-icon name="info-o" />
            <span>自定义充值最低10元，最高1000元</span>
          </div>
        </div>
      </div>

      <!-- 支付方式 -->
      <div v-if="selectedPackage || isCustomSelected" class="payment-section">
        <h3 class="section-title">支付方式</h3>
        
        <div class="payment-methods">
          <div 
            class="payment-item"
            :class="{ selected: paymentMethod === 'wechat' }"
            @click="paymentMethod = 'wechat'"
          >
            <div class="payment-icon wechat">
              <van-icon name="wechat-pay" />
            </div>
            <div class="payment-info">
              <div class="payment-name">微信支付</div>
              <div class="payment-desc">推荐使用</div>
            </div>
            <van-radio :model-value="paymentMethod === 'wechat'" />
          </div>
        </div>
      </div>
    </div>

    <!-- 底部支付按钮 -->
    <div v-if="selectedPackage || isCustomSelected" class="recharge-footer">
      <div class="amount-info">
        <span class="label">充值金额：</span>
        <span class="amount">¥{{ currentAmount.toFixed(2) }}</span>
      </div>
      
      <van-button 
        type="primary" 
        size="large"
        class="recharge-btn"
        :loading="isRecharging"
        @click="handleRecharge"
      >
        立即充值
      </van-button>
    </div>

    <!-- 充值记录弹窗 -->
    <van-popup 
      v-model:show="showRecords"
      position="right"
      :style="{ width: '100%', height: '100%' }"
    >
      <recharge-records @close="showRecords = false" />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { rechargeApi, type RechargePackage, type CreateRechargeOrderParams } from '@/api/recharge'
import { Toast, Dialog } from 'vant'
import RechargeRecords from '@/components/RechargeRecords.vue'

const router = useRouter()
const userStore = useUserStore()

// 状态管理
const isLoading = ref(false)
const isRecharging = ref(false)
const showRecords = ref(false)
const packages = ref<RechargePackage[]>([])
const selectedPackage = ref<RechargePackage | null>(null)
const customAmount = ref('')
const isCustomSelected = ref(false)
const paymentMethod = ref('wechat')

// 用户余额
const userBalance = ref(0)
const userGiftBalance = ref(0)

// 当前选择的金额
const currentAmount = computed(() => {
  if (isCustomSelected.value) {
    return parseFloat(customAmount.value) || 0
  }
  return selectedPackage.value?.amount || 0
})

// 自定义金额是否有效
const isValidCustomAmount = computed(() => {
  const amount = parseFloat(customAmount.value)
  return amount >= 10 && amount <= 1000
})

// 选择套餐
const selectPackage = (pkg: RechargePackage) => {
  selectedPackage.value = pkg
  isCustomSelected.value = false
  customAmount.value = ''
}

// 选择自定义金额
const selectCustomAmount = () => {
  if (!isValidCustomAmount.value) {
    Toast.fail('请输入10-1000元之间的金额')
    return
  }
  
  selectedPackage.value = null
  isCustomSelected.value = true
}

// 加载充值套餐
const loadPackages = async () => {
  try {
    isLoading.value = true
    const response = await rechargeApi.getPackageList()
    packages.value = response.packages
    userBalance.value = response.userBalance
    userGiftBalance.value = response.userGiftBalance
  } catch (error) {
    console.error('加载充值套餐失败:', error)
    Toast.fail('加载失败')
  } finally {
    isLoading.value = false
  }
}

// 处理充值
const handleRecharge = async () => {
  if (!paymentMethod.value) {
    Toast.fail('请选择支付方式')
    return
  }

  try {
    await Dialog.confirm({
      title: '确认充值',
      message: `确认充值 ¥${currentAmount.value.toFixed(2)} 吗？`
    })

    isRecharging.value = true

    let params: CreateRechargeOrderParams

    if (isCustomSelected.value) {
      // 自定义金额充值 - 创建临时套餐
      params = {
        packageId: 0, // 特殊ID表示自定义金额
        paymentMethod: paymentMethod.value as 'wechat'
      }
    } else if (selectedPackage.value) {
      params = {
        packageId: selectedPackage.value.id,
        paymentMethod: paymentMethod.value as 'wechat'
      }
    } else {
      Toast.fail('请选择充值套餐')
      return
    }

    const orderResponse = await rechargeApi.createOrder(params)

    if (paymentMethod.value === 'wechat') {
      // 调用微信支付
      await handleWechatPay(orderResponse)
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('充值失败:', error)
      Toast.fail('充值失败')
    }
  } finally {
    isRecharging.value = false
  }
}

// 处理微信支付
const handleWechatPay = async (orderResponse: any) => {
  try {
    // 模拟微信支付流程
    Toast.loading({
      message: '正在调起微信支付...',
      forbidClick: true,
      duration: 2000
    })

    // 模拟支付成功
    setTimeout(async () => {
      Toast.success('充值成功')
      
      // 更新用户余额
      await userStore.refreshUserInfo()
      userBalance.value = userStore.user?.balance || 0
      userGiftBalance.value = userStore.user?.giftBalance || 0
      
      // 重置选择
      selectedPackage.value = null
      isCustomSelected.value = false
      customAmount.value = ''
    }, 2000)
  } catch (error) {
    console.error('微信支付失败:', error)
    Toast.fail('支付失败')
  }
}

onMounted(() => {
  loadPackages()
  
  // 从用户信息中获取余额
  if (userStore.user) {
    userBalance.value = userStore.user.balance
    userGiftBalance.value = userStore.user.giftBalance
  }
})
</script>

<style scoped>
.recharge-container {
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

.recharge-content {
  padding: 12px;
}

.balance-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 20px;
  color: white;
}

.balance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.balance-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.balance-info {
  display: flex;
  align-items: center;
}

.balance-item {
  flex: 1;
  text-align: center;
}

.balance-amount {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.balance-amount.gift {
  color: #ffd700;
}

.balance-label {
  font-size: 14px;
  opacity: 0.8;
}

.balance-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.3);
  margin: 0 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 16px 4px;
}

.packages-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.package-item {
  position: relative;
  background: white;
  border-radius: 12px;
  padding: 16px;
  border: 2px solid #ebedf0;
  cursor: pointer;
  transition: all 0.3s;
}

.package-item.selected {
  border-color: #1989fa;
  background: #f8fafe;
}

.package-item.recommended {
  border-color: #ff9500;
}

.package-item.popular {
  border-color: #07c160;
}

.package-badge {
  position: absolute;
  top: -1px;
  right: 8px;
  font-size: 10px;
  color: white;
  padding: 2px 8px;
  border-radius: 0 12px 0 8px;
  font-weight: 600;
}

.package-badge.recommended {
  background: #ff9500;
}

.package-badge.popular {
  background: #07c160;
}

.package-content {
  margin-bottom: 12px;
}

.package-title {
  font-size: 14px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 8px;
}

.package-amounts {
  display: flex;
  align-items: baseline;
  margin-bottom: 4px;
}

.main-amount {
  font-size: 24px;
  font-weight: 700;
  color: #ee0a24;
}

.gift-amount {
  font-size: 12px;
  color: #07c160;
  margin-left: 8px;
  background: #f0f9ff;
  padding: 2px 6px;
  border-radius: 4px;
}

.package-total {
  font-size: 12px;
  color: #646566;
  margin-bottom: 8px;
}

.package-desc {
  font-size: 11px;
  color: #969799;
  line-height: 1.4;
}

.package-select {
  display: flex;
  justify-content: center;
}

.custom-recharge {
  margin-bottom: 20px;
}

.custom-input {
  background: white;
  border-radius: 12px;
  padding: 16px;
}

.amount-symbol {
  font-size: 16px;
  color: #323233;
  font-weight: 600;
}

.custom-note {
  display: flex;
  align-items: center;
  margin-top: 8px;
  font-size: 12px;
  color: #969799;
}

.custom-note .van-icon {
  margin-right: 4px;
}

.payment-section {
  margin-bottom: 20px;
}

.payment-methods {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.payment-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #ebedf0;
  cursor: pointer;
  transition: all 0.3s;
}

.payment-item:last-child {
  border-bottom: none;
}

.payment-item.selected {
  background: #f8fafe;
}

.payment-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-size: 20px;
}

.payment-icon.wechat {
  background: #07c160;
  color: white;
}

.payment-info {
  flex: 1;
}

.payment-name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin-bottom: 2px;
}

.payment-desc {
  font-size: 12px;
  color: #969799;
}

.recharge-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 12px 16px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.amount-info {
  display: flex;
  align-items: center;
  font-size: 16px;
  color: #323233;
}

.amount-info .amount {
  color: #ee0a24;
  font-weight: 600;
  margin-left: 4px;
}

.recharge-btn {
  flex: 1;
  height: 44px;
}
</style>