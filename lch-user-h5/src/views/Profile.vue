<template>
  <div class="profile-container">
    <!-- 导航栏 -->
    <van-nav-bar title="个人中心" />
    
    <div class="profile-content">
      <!-- 用户信息卡片 -->
      <div class="user-card">
        <div class="user-avatar">
          <van-image
            :src="userStore.user?.avatar || defaultAvatar"
            round
            width="60"
            height="60"
            fit="cover"
          />
        </div>
        
        <div class="user-info">
          <h3 class="user-name">{{ userStore.user?.nickname || '未设置昵称' }}</h3>
          <p class="user-phone">{{ formatPhone(userStore.user?.phone) }}</p>
        </div>
        
        <div class="user-actions">
          <van-button size="small" plain @click="handleEditProfile">
            编辑资料
          </van-button>
        </div>
      </div>

      <!-- 余额信息 -->
      <div class="balance-card">
        <div class="balance-header">
          <h3>我的余额</h3>
          <van-button size="small" type="primary" @click="$router.push('/recharge')">
            立即充值
          </van-button>
        </div>
        
        <div class="balance-info">
          <div class="balance-item" @click="$router.push('/recharge')">
            <div class="balance-amount">¥{{ (userStore.user?.balance || 0).toFixed(2) }}</div>
            <div class="balance-label">余额</div>
          </div>
          
          <div class="balance-divider"></div>
          
          <div class="balance-item" @click="$router.push('/recharge')">
            <div class="balance-amount gift">¥{{ (userStore.user?.giftBalance || 0).toFixed(2) }}</div>
            <div class="balance-label">赠送余额</div>
          </div>
        </div>
      </div>

      <!-- 快捷入口 -->
      <div class="quick-actions">
        <div class="action-item" @click="$router.push('/orders')">
          <div class="action-icon">
            <van-icon name="orders-o" />
          </div>
          <div class="action-text">我的订单</div>
        </div>
        
        <div class="action-item" @click="$router.push('/coupons')">
          <div class="action-icon">
            <van-icon name="coupon-o" />
          </div>
          <div class="action-text">优惠券</div>
        </div>
        
        <div class="action-item" @click="$router.push('/recharge')">
          <div class="action-icon">
            <van-icon name="gold-coin-o" />
          </div>
          <div class="action-text">充值中心</div>
        </div>
        
        <div class="action-item" @click="handleContactService">
          <div class="action-icon">
            <van-icon name="service-o" />
          </div>
          <div class="action-text">客服中心</div>
        </div>
      </div>

      <!-- 菜单列表 -->
      <div class="menu-list">
        <van-cell-group>
          <van-cell 
            title="我的订单" 
            is-link 
            @click="$router.push('/orders')"
          >
            <template #icon>
              <van-icon name="orders-o" class="menu-icon" />
            </template>
          </van-cell>
          
          <van-cell 
            title="优惠券" 
            is-link 
            @click="$router.push('/coupons')"
          >
            <template #icon>
              <van-icon name="coupon-o" class="menu-icon" />
            </template>
            <template #value>
              <span class="coupon-count">{{ unusedCouponsCount }}</span>
            </template>
          </van-cell>
          
          <van-cell 
            title="充值中心" 
            is-link 
            @click="$router.push('/recharge')"
          >
            <template #icon>
              <van-icon name="gold-coin-o" class="menu-icon" />
            </template>
          </van-cell>
          
          <van-cell 
            title="地址管理" 
            is-link 
            @click="handleAddressManage"
          >
            <template #icon>
              <van-icon name="location-o" class="menu-icon" />
            </template>
          </van-cell>
        </van-cell-group>
        
        <van-cell-group>
          <van-cell 
            title="客服中心" 
            is-link 
            @click="handleContactService"
          >
            <template #icon>
              <van-icon name="service-o" class="menu-icon" />
            </template>
          </van-cell>
          
          <van-cell 
            title="意见反馈" 
            is-link 
            @click="handleFeedback"
          >
            <template #icon>
              <van-icon name="comment-o" class="menu-icon" />
            </template>
          </van-cell>
          
          <van-cell 
            title="关于我们" 
            is-link 
            @click="handleAbout"
          >
            <template #icon>
              <van-icon name="info-o" class="menu-icon" />
            </template>
          </van-cell>
        </van-cell-group>
        
        <van-cell-group>
          <van-cell 
            title="设置" 
            is-link 
            @click="handleSettings"
          >
            <template #icon>
              <van-icon name="setting-o" class="menu-icon" />
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <!-- 退出登录 -->
      <div class="logout-section">
        <van-button 
          type="danger" 
          size="large" 
          block 
          plain 
          @click="handleLogout"
        >
          退出登录
        </van-button>
      </div>
    </div>

    <!-- 编辑资料弹窗 -->
    <van-popup 
      v-model:show="showEditProfile"
      position="bottom"
      :style="{ height: '60%' }"
      round
    >
      <profile-editor 
        @close="showEditProfile = false"
        @updated="handleProfileUpdated"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { couponsApi } from '@/api/coupons'
import { showSuccessToast, showFailToast, showDialog } from 'vant'
import ProfileEditor from '@/components/ProfileEditor.vue'

const router = useRouter()
const userStore = useUserStore()

const showEditProfile = ref(false)
const unusedCouponsCount = ref(0)
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

// 格式化手机号
const formatPhone = (phone?: string) => {
  if (!phone) return '未绑定手机号'
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

// 加载用户优惠券数量
const loadCouponsCount = async () => {
  try {
    const response = await couponsApi.getUserCoupons({ status: 'unused', size: 1 })
    unusedCouponsCount.value = response.total
  } catch (error) {
    console.error('加载优惠券数量失败:', error)
    // 静默处理优惠券API错误，不显示提示
  }
}

// 编辑资料
const handleEditProfile = () => {
  showEditProfile.value = true
}

// 资料更新回调
const handleProfileUpdated = () => {
  showEditProfile.value = false
  showSuccessToast('资料更新成功')
  // 重新检查认证状态以刷新用户信息
  userStore.checkAuthStatus()
}

// 联系客服
const handleContactService = () => {
  showDialog({
    title: '联系客服',
    message: '客服电话：400-888-8888\n工作时间：9:00-18:00',
    confirmButtonText: '拨打电话'
  }).then(() => {
    window.location.href = 'tel:400-888-8888'
  }).catch(() => {
    // 用户取消
  })
}

// 地址管理
const handleAddressManage = () => {
  showFailToast('地址管理功能开发中')
}

// 意见反馈
const handleFeedback = () => {
  showFailToast('意见反馈功能开发中')
}

// 关于我们
const handleAbout = () => {
  showDialog({
    title: '关于亮车惠',
    message: '亮车惠是一款便民的自助洗车服务应用，致力于为用户提供高效、便捷的洗车体验。\n\n版本号：v1.0.0',
    confirmButtonText: '知道了'
  })
}

// 设置
const handleSettings = () => {
  showFailToast('设置功能开发中')
}

// 退出登录
const handleLogout = () => {
  showDialog({
    title: '退出登录',
    message: '确定要退出登录吗？',
    showCancelButton: true,
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(() => {
    userStore.logout()
    showSuccessToast('已退出登录')
    router.push('/auth')
  }).catch(() => {
    // 用户取消
  })
}

onMounted(() => {
  loadCouponsCount()
})
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: #f7f8fa;
}

.profile-content {
  padding: 12px;
}

.user-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 16px;
  color: white;
  display: flex;
  align-items: center;
}

.user-avatar {
  margin-right: 16px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px;
}

.user-phone {
  font-size: 14px;
  opacity: 0.8;
  margin: 0;
}

.user-actions {
  margin-left: 16px;
}

.balance-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.balance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.balance-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

.balance-info {
  display: flex;
  align-items: center;
}

.balance-item {
  flex: 1;
  text-align: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.balance-item:hover {
  background: #f7f8fa;
}

.balance-amount {
  font-size: 24px;
  font-weight: 700;
  color: #323233;
  margin-bottom: 4px;
}

.balance-amount.gift {
  color: #ff9500;
}

.balance-label {
  font-size: 12px;
  color: #646566;
}

.balance-divider {
  width: 1px;
  height: 40px;
  background: #ebedf0;
  margin: 0 16px;
}

.quick-actions {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.action-item:hover {
  background: #f7f8fa;
}

.action-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #1989fa 0%, #52c41a 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  color: white;
  font-size: 18px;
}

.action-text {
  font-size: 12px;
  color: #323233;
  text-align: center;
}

.menu-list {
  margin-bottom: 16px;
}

.menu-list .van-cell-group {
  margin-bottom: 12px;
}

.menu-icon {
  margin-right: 12px;
  color: #1989fa;
  font-size: 18px;
}

.coupon-count {
  background: #ee0a24;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
  margin-right: 8px;
}

.logout-section {
  margin-bottom: 20px;
}

:deep(.van-cell-group) {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.van-cell) {
  padding: 16px;
  font-size: 16px;
}

:deep(.van-cell__title) {
  color: #323233;
  font-weight: 500;
}

:deep(.van-cell:not(:last-child)::after) {
  left: 56px;
}
</style>
