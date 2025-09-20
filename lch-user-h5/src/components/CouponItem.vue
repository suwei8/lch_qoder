<template>
  <div class="coupon-item" :class="itemClass" @click="$emit('viewDetail', coupon)">
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

      <div class="coupon-validity">
        <van-icon name="clock-o" />
        <span>{{ validityText }}</span>
      </div>
    </div>

    <div class="coupon-right">
      <div class="coupon-status" :class="statusClass">
        {{ statusText }}
      </div>
      
      <van-button 
        v-if="coupon.status === 'unused'"
        size="small"
        type="primary"
        @click.stop="$emit('useCoupon', coupon)"
      >
        立即使用
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { UserCoupon } from '@/api/coupons'
import { formatDate } from '@/utils/date'

interface Props {
  coupon: UserCoupon
}

const props = defineProps<Props>()

defineEmits<{
  viewDetail: [coupon: UserCoupon]
  useCoupon: [coupon: UserCoupon]
}>()

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

// 状态文本
const statusText = computed(() => {
  const statusMap = {
    unused: '未使用',
    used: '已使用',
    expired: '已过期'
  }
  return statusMap[props.coupon.status] || '未知'
})

// 状态样式类
const statusClass = computed(() => {
  const classMap = {
    unused: 'status-unused',
    used: 'status-used',
    expired: 'status-expired'
  }
  return classMap[props.coupon.status] || ''
})

// 优惠券整体样式类
const itemClass = computed(() => {
  const classes = [`coupon-${props.coupon.status}`]
  
  if (props.coupon.isNewbie) {
    classes.push('coupon-newbie')
  }
  
  return classes
})

// 有效期文本
const validityText = computed(() => {
  const now = new Date()
  const validUntil = new Date(props.coupon.validUntil)
  
  if (props.coupon.status === 'used' && props.coupon.usedAt) {
    return `已于 ${formatDate(props.coupon.usedAt)} 使用`
  }
  
  if (props.coupon.status === 'expired') {
    return `已于 ${formatDate(props.coupon.validUntil)} 过期`
  }
  
  const diffTime = validUntil.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays <= 0) {
    return '今日过期'
  } else if (diffDays <= 7) {
    return `${diffDays}天后过期`
  } else {
    return `有效期至 ${formatDate(props.coupon.validUntil)}`
  }
})
</script>

<style scoped>
.coupon-item {
  background: white;
  margin: 12px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  position: relative;
}

.coupon-item::before {
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

.coupon-item:active {
  transform: scale(0.98);
}

.coupon-item.coupon-used,
.coupon-item.coupon-expired {
  opacity: 0.6;
}

.coupon-item.coupon-newbie {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  color: white;
}

.coupon-item.coupon-newbie .coupon-content,
.coupon-item.coupon-newbie .coupon-name,
.coupon-item.coupon-newbie .coupon-desc,
.coupon-item.coupon-newbie .coupon-condition,
.coupon-item.coupon-newbie .coupon-validity {
  color: white;
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

.coupon-item.coupon-newbie .coupon-left {
  background: rgba(255, 255, 255, 0.2);
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
  justify-content: space-between;
}

.coupon-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
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
  margin-bottom: 8px;
  line-height: 1.4;
}

.coupon-condition {
  font-size: 13px;
  color: #969799;
  margin-bottom: 8px;
}

.coupon-validity {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #969799;
}

.coupon-validity .van-icon {
  margin-right: 4px;
}

.coupon-right {
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  min-width: 80px;
}

.coupon-status {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
}

.status-unused {
  color: #07c160;
}

.status-used {
  color: #969799;
}

.status-expired {
  color: #ee0a24;
}
</style>