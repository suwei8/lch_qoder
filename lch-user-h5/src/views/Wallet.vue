<template>
  <div class="wallet-page">
    <van-nav-bar
      title="我的钱包"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
    />

    <div class="wallet-content">
      <!-- 余额卡片 -->
      <div class="balance-card">
        <div class="balance-info">
          <div class="balance-amount">¥{{ balance }}</div>
          <div class="balance-label">账户余额</div>
        </div>
        <van-button type="primary" size="small" @click="goToRecharge">充值</van-button>
      </div>

      <!-- 功能菜单 -->
      <van-cell-group title="钱包功能">
        <van-cell title="充值记录" is-link @click="goToRechargeHistory" />
        <van-cell title="消费记录" is-link @click="goToConsumeHistory" />
        <van-cell title="提现" is-link @click="goToWithdraw" />
      </van-cell-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const balance = ref(128.50)

const goToRecharge = () => {
  router.push('/recharge')
}

const goToRechargeHistory = () => {
  // TODO: 实现充值记录页面
}

const goToConsumeHistory = () => {
  // TODO: 实现消费记录页面
}

const goToWithdraw = () => {
  // TODO: 实现提现页面
}
</script>

<style scoped>
.wallet-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.wallet-content {
  padding: 16px;
}

.balance-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.balance-amount {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 4px;
}

.balance-label {
  opacity: 0.9;
}
</style>