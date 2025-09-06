<template>
  <div class="available-coupons">
    <!-- 头部 -->
    <div class="header">
      <h3>领取优惠券</h3>
      <van-icon name="cross" @click="$emit('close')" />
    </div>

    <!-- 优惠券列表 -->
    <div class="coupons-list">
      <div v-if="isLoading" class="loading-state">
        <van-loading size="24px">加载中...</van-loading>
      </div>

      <div v-else-if="availableCoupons.length === 0" class="empty-state">
        <van-empty description="暂无可领取的优惠券" />
      </div>

      <div v-else>
        <available-coupon-item
          v-for="coupon in availableCoupons"
          :key="coupon.id"
          :coupon="coupon"
          @claim="handleClaim"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { couponsApi, type AvailableCoupon } from '@/api/coupons'
import { Toast } from 'vant'
import AvailableCouponItem from '@/components/AvailableCouponItem.vue'

defineEmits<{
  close: []
  claimed: []
}>()

const isLoading = ref(false)
const availableCoupons = ref<AvailableCoupon[]>([])

// 加载可领取的优惠券
const loadAvailableCoupons = async () => {
  try {
    isLoading.value = true
    const response = await couponsApi.getAvailableCoupons()
    availableCoupons.value = response.coupons
  } catch (error) {
    console.error('加载可领取优惠券失败:', error)
    Toast.fail('加载失败')
  } finally {
    isLoading.value = false
  }
}

// 领取优惠券
const handleClaim = async (coupon: AvailableCoupon) => {
  try {
    const response = await couponsApi.claimCoupon({ couponId: coupon.id })
    
    if (response.success) {
      Toast.success('领取成功')
      
      // 从列表中移除已领取的优惠券
      const index = availableCoupons.value.findIndex(c => c.id === coupon.id)
      if (index > -1) {
        availableCoupons.value.splice(index, 1)
      }
      
      // 通知父组件
      emit('claimed')
    } else {
      Toast.fail(response.message || '领取失败')
    }
  } catch (error) {
    console.error('领取优惠券失败:', error)
    Toast.fail('领取失败')
  }
}

const emit = defineEmits<{
  close: []
  claimed: []
}>()

onMounted(() => {
  loadAvailableCoupons()
})
</script>

<style scoped>
.available-coupons {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f7f8fa;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #323233;
  margin: 0;
}

.header .van-icon {
  font-size: 20px;
  color: #969799;
  cursor: pointer;
}

.coupons-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.empty-state {
  padding: 60px 20px;
}
</style>