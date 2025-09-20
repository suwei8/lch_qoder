<template>
  <div class="coupon-list-page">
    <van-nav-bar
      title="优惠券"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
    />

    <div class="coupon-content">
      <van-tabs v-model:active="activeTab">
        <van-tab title="可使用" name="available">
          <div class="coupon-list">
            <div v-for="coupon in availableCoupons" :key="coupon.id" class="coupon-item">
              <div class="coupon-info">
                <div class="coupon-amount">¥{{ coupon.amount }}</div>
                <div class="coupon-desc">{{ coupon.description }}</div>
                <div class="coupon-expire">有效期至：{{ coupon.expireDate }}</div>
              </div>
              <van-button size="small" type="primary">立即使用</van-button>
            </div>
          </div>
        </van-tab>
        <van-tab title="已使用" name="used">
          <van-empty description="暂无已使用的优惠券" />
        </van-tab>
        <van-tab title="已过期" name="expired">
          <van-empty description="暂无过期的优惠券" />
        </van-tab>
      </van-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref('available')

const availableCoupons = ref([
  {
    id: 1,
    amount: 10,
    description: '洗车满30元可用',
    expireDate: '2024-12-31'
  },
  {
    id: 2,
    amount: 20,
    description: '洗车满50元可用',
    expireDate: '2024-12-31'
  }
])
</script>

<style scoped>
.coupon-list-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.coupon-content {
  padding: 16px;
}

.coupon-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
}

.coupon-amount {
  font-size: 24px;
  font-weight: bold;
  color: #ee0a24;
}

.coupon-desc {
  color: #666;
  margin: 4px 0;
}

.coupon-expire {
  font-size: 12px;
  color: #999;
}
</style>