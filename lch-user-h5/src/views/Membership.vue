<template>
  <div class="membership-page">
    <van-nav-bar
      title="会员中心"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
    />

    <div class="membership-content">
      <!-- 会员卡片 -->
      <div class="member-card">
        <div class="card-bg">
          <div class="member-info">
            <h3>{{ memberLevel }}</h3>
            <p>积分：{{ memberPoints }}</p>
          </div>
        </div>
      </div>

      <!-- 会员权益 -->
      <van-cell-group title="会员权益">
        <van-cell title="洗车折扣" value="9折优惠" />
        <van-cell title="积分兑换" value="可兑换优惠券" />
        <van-cell title="生日特权" value="生日月免费洗车" />
      </van-cell-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const memberLevel = ref('黄金会员')
const memberPoints = ref(1280)
</script>

<style scoped>
.membership-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.membership-content {
  padding: 16px;
}

.member-card {
  margin-bottom: 20px;
}

.card-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  color: white;
}

.member-info h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
}

.member-info p {
  margin: 0;
  opacity: 0.9;
}
</style>