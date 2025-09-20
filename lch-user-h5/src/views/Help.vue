<template>
  <div class="help-page">
    <van-nav-bar
      title="帮助中心"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
    />

    <div class="help-content">
      <van-collapse v-model="activeNames">
        <van-collapse-item title="如何预约洗车？" name="1">
          <p>1. 在首页点击"预约洗车"</p>
          <p>2. 选择门店和服务类型</p>
          <p>3. 选择预约时间</p>
          <p>4. 填写车牌号和联系方式</p>
          <p>5. 确认预约信息并提交</p>
        </van-collapse-item>
        
        <van-collapse-item title="如何使用优惠券？" name="2">
          <p>在支付时选择可用的优惠券即可自动抵扣相应金额。</p>
        </van-collapse-item>
        
        <van-collapse-item title="如何充值？" name="3">
          <p>进入"我的钱包"页面，点击充值按钮，选择充值金额并完成支付。</p>
        </van-collapse-item>
        
        <van-collapse-item title="如何取消订单？" name="4">
          <p>在订单详情页面，如果订单状态允许，可以点击"取消订单"按钮。</p>
        </van-collapse-item>
      </van-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activeNames = ref(['1'])
</script>

<style scoped>
.help-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.help-content {
  padding: 16px;
}

:deep(.van-collapse-item__content) {
  padding: 16px;
  background: #f7f8fa;
}

:deep(.van-collapse-item__content p) {
  margin: 8px 0;
  color: #646566;
  line-height: 1.5;
}
</style>