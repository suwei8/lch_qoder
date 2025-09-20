<template>
  <div class="available-coupon-item">
    <div class="coupon-left">
      <div class="coupon-value">
        <span v-if="coupon.type === 'discount'" class="value-text">
          {{ (coupon.value * 10).toFixed(1) }}
        </span>
        <span v-else class="value-text">
          {{ coupon.value }}
        </span>
        <span class="value-unit">
          {{ coupon.type === 'discount' ? '折' : '元' }}
        </span>
      </div>
      <div class="coupon-type">
        {{ typeText }}
      </div>
    </div>

    <div class="coupon-content">
      <div class="coupon-header">
        <h3 class="coupon-name">{{ coupon.name }}</h3>
        <div class="coupon-tags">
          <van-tag 
            v-if="coupon.isNewbie" 
            type="danger" 

          >
            新人专享
          </van-tag>
          <van-tag 
            v-for="tag in coupon.tags" 
            :key="tag"
            type="primary" 

          >
            {{ tag }}
          </van-tag>
        </div>
      </div>

      <div class="coupon-desc">
        {{ coupon.description }}
      </div>

      <div class="coupon-condition">
        满{{ coupon.minAmount }}元可用
        <span v-if="coupon.maxDiscount && coupon.type === 'discount'">
          (最高优惠{{ coupon.maxDiscount }}元)
        </span>
      </div>

      <div class="coupon-info">
        <div class="validity-info">
          <van-icon name="clock-o" />
          <span>领取后{{ coupon.validDays }}天内有效</span>
        </div>
        
        <div class="stock-info">
          <van-icon name="fire-o" />
          <span>剩余{{ coupon.remainCount }}张</span>
        </div>
      </div>

      <div v-if="coupon.conditions && coupon.conditions.length > 0" class="coupon-conditions">
        <div class="conditions-title">使用条件：</div>
        <ul class="conditions-list">
          <li v-for="condition in coupon.conditions" :key="condition">
            {{ condition }}
          </li>
        </ul>
      </div>
    </div>

    <div class="coupon-right">
      <van-button 
        type="primary"
        size="small"
        :disabled="coupon.remainCount <= 0"
        :loading="isLoading"
        @click="handleClaim"
      >
        {{ coupon.remainCount <= 0 ? '已抢完' : '立即领取' }}
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AvailableCoupon } from '@/api/coupons'

interface Props {
  coupon: AvailableCoupon
}

const props = defineProps<Props>()

const emit = defineEmits<{
  claim: [coupon: AvailableCoupon]
}>()

const isLoading = ref(false)

// 优惠券类型文本
const typeText = computed(() => {
  const typeMap = {
    discount: '折扣券',
    reduce: '满减券',
    newbie: '新人券',
    cashback: '返现券'
  }
  return typeMap[props.coupon.type] || '优惠券'
})

// 领取优惠券
const handleClaim = async () => {
  if (props.coupon.remainCount <= 0) return
  
  isLoading.value = true
  try {
    emit('claim', props.coupon)
  } finally {
    // 延迟重置loading状态，避免按钮闪烁
    setTimeout(() => {
      isLoading.value = false
    }, 1000)
  }
}
</script>

<style scoped>
.available-coupon-item {
  background: white;
  margin: 12px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  position: relative;
}

.available-coupon-item::before {
  content: '';
  position: absolute;
  left: 88px;
  top: 20px;
  bottom: 20px;
  width: 1px;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 4px,
    #ddd 4px,
    #ddd 8px
  );
}

.coupon-left {
  width: 88px;
  background: linear-gradient(135deg, #1989fa 0%, #52c41a 100%);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 8px;
  flex-shrink: 0;
}

.coupon-value {
  display: flex;
  align-items: baseline;
  margin-bottom: 4px;
}

.value-text {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.value-unit {
  font-size: 14px;
  font-weight: 600;
  margin-left: 2px;
}

.coupon-type {
  font-size: 12px;
  opacity: 0.9;
}

.coupon-content {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.coupon-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.coupon-name {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0;
  flex: 1;
}

.coupon-tags {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  margin-left: 8px;
}

.coupon-desc {
  font-size: 14px;
  color: #646566;
  line-height: 1.4;
}

.coupon-condition {
  font-size: 13px;
  color: #969799;
}

.coupon-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #969799;
}

.validity-info,
.stock-info {
  display: flex;
  align-items: center;
  gap: 4px;
}

.coupon-conditions {
  font-size: 12px;
  color: #969799;
}

.conditions-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.conditions-list {
  margin: 0;
  padding-left: 16px;
}

.conditions-list li {
  line-height: 1.4;
  margin-bottom: 2px;
}

.coupon-right {
  padding: 16px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 80px;
}
</style>