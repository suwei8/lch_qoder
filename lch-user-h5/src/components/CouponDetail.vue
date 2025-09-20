<template>
  <div class="coupon-detail">
    <!-- 头部 -->
    <div class="header">
      <h3>优惠券详情</h3>
      <van-icon name="cross" @click="$emit('close')" />
    </div>

    <!-- 优惠券信息 -->
    <div class="coupon-info">
      <div class="coupon-card" :class="cardClass">
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
            <div class="coupon-status" :class="statusClass">
              {{ statusText }}
            </div>
          </div>

          <div class="coupon-desc">
            {{ coupon.description }}
          </div>

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
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="usage-info">
      <h4>使用说明</h4>
      <div class="info-items">
        <div class="info-item">
          <span class="label">使用条件：</span>
          <span class="value">
            满{{ coupon.minAmount }}元可用
            <span v-if="coupon.maxDiscount && coupon.type === 'discount'">
              (最高优惠{{ coupon.maxDiscount }}元)
            </span>
          </span>
        </div>
        
        <div class="info-item">
          <span class="label">有效期：</span>
          <span class="value">{{ validityText }}</span>
        </div>
        
        <div v-if="coupon.status === 'used'" class="info-item">
          <span class="label">使用时间：</span>
          <span class="value">{{ formatDateTime(coupon.usedAt!) }}</span>
        </div>
        
        <div v-if="coupon.status === 'used' && coupon.orderId" class="info-item">
          <span class="label">使用订单：</span>
          <span class="value">{{ coupon.orderId }}</span>
        </div>
      </div>
    </div>

    <!-- 使用须知 -->
    <div class="notice-info">
      <h4>使用须知</h4>
      <ul class="notice-list">
        <li>优惠券不可转让，不可兑换现金</li>
        <li>每个订单仅可使用一张优惠券</li>
        <li>优惠券过期后将自动失效</li>
        <li>如有疑问请联系客服</li>
      </ul>
    </div>

    <!-- 底部按钮 -->
    <div class="bottom-actions">
      <van-button 
        v-if="coupon.status === 'unused'"
        type="primary" 
        size="large"
        block
        @click="$emit('useCoupon', coupon)"
      >
        立即使用
      </van-button>
      
      <van-button 
        v-else
        size="large"
        block
        disabled
      >
        {{ coupon.status === 'used' ? '已使用' : '已过期' }}
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { UserCoupon } from '@/api/coupons'
import { formatDate, formatDateTime } from '@/utils/date'

interface Props {
  coupon: UserCoupon
}

const props = defineProps<Props>()

defineEmits<{
  close: []
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

// 卡片样式类
const cardClass = computed(() => {
  const classes = [`coupon-${props.coupon.status}`]
  
  if (props.coupon.isNewbie) {
    classes.push('coupon-newbie')
  }
  
  return classes
})

// 有效期文本
const validityText = computed(() => {
  const validFrom = formatDate(props.coupon.validFrom)
  const validUntil = formatDate(props.coupon.validUntil)
  
  if (validFrom === validUntil) {
    return `${validFrom} 当日有效`
  }
  
  return `${validFrom} 至 ${validUntil}`
})
</script>

<style scoped>
.coupon-detail {
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

.coupon-info {
  padding: 16px;
}

.coupon-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  position: relative;
}

.coupon-card::before {
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

.coupon-card.coupon-used,
.coupon-card.coupon-expired {
  opacity: 0.6;
}

.coupon-card.coupon-newbie {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  color: white;
}

.coupon-card.coupon-newbie .coupon-content,
.coupon-card.coupon-newbie .coupon-name,
.coupon-card.coupon-newbie .coupon-desc {
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

.coupon-card.coupon-newbie .coupon-left {
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

.coupon-status {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  flex-shrink: 0;
}

.status-unused {
  color: #07c160;
  background: #f0f9ff;
}

.status-used {
  color: #969799;
  background: #f7f8fa;
}

.status-expired {
  color: #ee0a24;
  background: #ffeef0;
}

.coupon-desc {
  font-size: 14px;
  color: #646566;
  line-height: 1.4;
}

.coupon-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.usage-info,
.notice-info {
  background: white;
  margin: 0 16px 16px;
  border-radius: 12px;
  padding: 16px;
}

.usage-info h4,
.notice-info h4 {
  font-size: 16px;
  font-weight: 600;
  color: #323233;
  margin: 0 0 12px;
}

.info-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  font-size: 14px;
}

.info-item .label {
  color: #646566;
  width: 80px;
  flex-shrink: 0;
}

.info-item .value {
  color: #323233;
  flex: 1;
}

.notice-list {
  margin: 0;
  padding-left: 16px;
}

.notice-list li {
  font-size: 14px;
  color: #646566;
  line-height: 1.5;
  margin-bottom: 6px;
}

.bottom-actions {
  padding: 16px;
  background: white;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}
</style>