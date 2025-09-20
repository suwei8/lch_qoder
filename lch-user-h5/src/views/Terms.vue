<template>
  <div class="terms-page">
    <van-nav-bar
      title="服务条款"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
    />

    <div class="terms-content">
      <div class="terms-text">
        <h3>服务条款</h3>
        <p class="update-time">更新时间：2024年1月1日</p>
        
        <section>
          <h4>1. 服务说明</h4>
          <p>本平台为用户提供智能洗车预约和支付服务，包括：</p>
          <ul>
            <li>洗车门店查找和预约</li>
            <li>在线支付和优惠券使用</li>
            <li>订单管理和服务评价</li>
          </ul>
        </section>

        <section>
          <h4>2. 用户责任</h4>
          <p>用户在使用本服务时应当：</p>
          <ul>
            <li>提供真实、准确的个人信息</li>
            <li>按时到达预约门店接受服务</li>
            <li>遵守门店的相关规定</li>
            <li>不得恶意取消订单或恶意评价</li>
          </ul>
        </section>

        <section>
          <h4>3. 服务费用</h4>
          <p>服务费用说明：</p>
          <ul>
            <li>洗车服务费用以门店标价为准</li>
            <li>支持多种支付方式</li>
            <li>优惠券和积分可按规则抵扣</li>
            <li>退款按照相关规定执行</li>
          </ul>
        </section>

        <section>
          <h4>4. 免责声明</h4>
          <p>以下情况本平台不承担责任：</p>
          <ul>
            <li>因不可抗力导致的服务中断</li>
            <li>用户设备或网络问题</li>
            <li>第三方门店的服务质量问题</li>
          </ul>
        </section>

        <section>
          <h4>5. 条款变更</h4>
          <p>我们保留随时修改本服务条款的权利，修改后的条款将在平台上公布。继续使用服务即表示您同意修改后的条款。</p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 组件逻辑
</script>

<style scoped>
.terms-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.terms-content {
  padding: 16px;
}

.terms-text {
  background: white;
  border-radius: 12px;
  padding: 20px;
  line-height: 1.6;
}

.terms-text h3 {
  margin: 0 0 8px 0;
  color: #323233;
  font-size: 20px;
}

.update-time {
  color: #969799;
  font-size: 14px;
  margin: 0 0 24px 0;
}

.terms-text section {
  margin-bottom: 24px;
}

.terms-text h4 {
  margin: 0 0 12px 0;
  color: #323233;
  font-size: 16px;
}

.terms-text p {
  margin: 0 0 8px 0;
  color: #646566;
}

.terms-text ul {
  margin: 8px 0;
  padding-left: 20px;
}

.terms-text li {
  margin: 4px 0;
  color: #646566;
}
</style>