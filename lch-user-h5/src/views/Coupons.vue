<template>
  <div class="coupons-container">
    <!-- 导航栏 -->
    <van-nav-bar title="我的优惠券" left-arrow @click-left="$router.back()">
      <template #right>
        <van-button size="small" type="primary" plain @click="showAvailable = true">
          领取优惠券
        </van-button>
      </template>
    </van-nav-bar>
    
    <!-- 状态选项卡 -->
    <van-tabs v-model:active="activeTab" @change="handleTabChange" sticky>
      <van-tab :title="`可使用(${counts.unused})`" name="unused" />
      <van-tab :title="`已使用(${counts.used})`" name="used" />
      <van-tab :title="`已过期(${counts.expired})`" name="expired" />
    </van-tabs>

    <!-- 优惠券列表 -->
    <div class="coupons-content">
      <van-pull-refresh v-model="isRefreshing" @refresh="onRefresh">
        <van-list
          v-model:loading="isLoading"
          :finished="isFinished"
          finished-text="没有更多了"
          @load="onLoad"
        >
          <div v-if="coupons.length === 0 && !isLoading" class="empty-state">
            <van-empty
              :image="getEmptyImage()"
              :description="getEmptyDescription()"
            >
              <van-button 
                v-if="activeTab === 'unused'"
                type="primary" 
                size="small"
                @click="showAvailable = true"
              >
                去领取优惠券
              </van-button>
            </van-empty>
          </div>
          
          <div v-else>
            <coupon-item
              v-for="coupon in coupons"
              :key="coupon.id"
              :coupon="coupon"
              @view-detail="handleViewDetail"
              @use-coupon="handleUseCoupon"
            />
          </div>
        </van-list>
      </van-pull-refresh>
    </div>

    <!-- 可领取优惠券弹窗 -->
    <van-popup 
      v-model:show="showAvailable"
      position="bottom"
      :style="{ height: '80%' }"
      round
    >
      <available-coupons 
        @close="showAvailable = false"
        @claimed="handleCouponClaimed"
      />
    </van-popup>

    <!-- 优惠券详情弹窗 -->
    <van-popup 
      v-model:show="showDetail"
      position="bottom"
      :style="{ height: '60%' }"
      round
    >
      <coupon-detail 
        v-if="selectedCoupon"
        :coupon="selectedCoupon"
        @close="showDetail = false"
        @use-coupon="handleUseCoupon"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { couponsApi, type UserCoupon, type CouponListParams, type CouponStatus } from '@/api/coupons'
import { Toast } from 'vant'
import CouponItem from '@/components/CouponItem.vue'
import AvailableCoupons from '@/components/AvailableCoupons.vue'
import CouponDetail from '@/components/CouponDetail.vue'

const router = useRouter()

// 状态管理
const activeTab = ref<CouponStatus>('unused')
const isLoading = ref(false)
const isRefreshing = ref(false)
const isFinished = ref(false)
const coupons = ref<UserCoupon[]>([])
const showAvailable = ref(false)
const showDetail = ref(false)
const selectedCoupon = ref<UserCoupon | null>(null)

// 分页参数
const pagination = reactive({
  page: 1,
  size: 10
})

// 统计数据
const counts = reactive({
  unused: 0,
  used: 0,
  expired: 0
})

// 空状态配置
const getEmptyImage = () => {
  return 'https://fastly.jsdelivr.net/npm/@vant/assets/custom-empty-image.png'
}

const getEmptyDescription = () => {
  const descriptions = {
    unused: '暂无可用优惠券',
    used: '暂无已使用优惠券',
    expired: '暂无过期优惠券'
  }
  return descriptions[activeTab.value] || '暂无优惠券'
}

// 加载优惠券列表
const loadCoupons = async (isRefresh = false) => {
  try {
    if (isRefresh) {
      pagination.page = 1
      isFinished.value = false
    }
    
    const params: CouponListParams = {
      status: activeTab.value,
      page: pagination.page,
      size: pagination.size
    }
    
    const response = await couponsApi.getUserCoupons(params)
    
    if (isRefresh) {
      coupons.value = response.coupons
    } else {
      coupons.value.push(...response.coupons)
    }
    
    // 更新统计数据
    Object.assign(counts, response.counts)
    
    isFinished.value = !response.hasMore
    pagination.page++
  } catch (error) {
    console.error('加载优惠券列表失败:', error)
    Toast.fail('加载失败')
  }
}

// 下拉刷新
const onRefresh = async () => {
  isRefreshing.value = true
  await loadCoupons(true)
  isRefreshing.value = false
}

// 上拉加载
const onLoad = async () => {
  if (isRefreshing.value) return
  isLoading.value = true
  await loadCoupons()
  isLoading.value = false
}

// 切换选项卡
const handleTabChange = () => {
  coupons.value = []
  pagination.page = 1
  isFinished.value = false
  loadCoupons(true)
}

// 查看优惠券详情
const handleViewDetail = (coupon: UserCoupon) => {
  selectedCoupon.value = coupon
  showDetail.value = true
}

// 使用优惠券
const handleUseCoupon = (coupon: UserCoupon) => {
  // 跳转到首页选择门店
  router.push({
    path: '/',
    query: { couponId: coupon.id }
  })
}

// 优惠券领取成功回调
const handleCouponClaimed = () => {
  showAvailable.value = false
  // 如果当前在未使用标签页，刷新列表
  if (activeTab.value === 'unused') {
    onRefresh()
  }
  Toast.success('领取成功')
}

onMounted(() => {
  loadCoupons(true)
})
</script>

<style scoped>
.coupons-container {
  min-height: 100vh;
  background: #f7f8fa;
}

.coupons-content {
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

:deep(.van-nav-bar__right) {
  padding-right: 16px;
}
</style>
