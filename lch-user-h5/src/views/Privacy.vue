<template>
  <div class="privacy-page">
    <van-nav-bar
      title="隐私政策"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
    />

    <div class="privacy-content">
      <div class="policy-text">
        <h3>隐私政策</h3>
        <p class="update-time">更新时间：2024年1月1日</p>
        
        <section>
          <h4>1. 信息收集</h4>
          <p>我们会收集您在使用服务过程中主动提供的信息，包括但不限于：</p>
          <ul>
            <li>注册信息：手机号码、昵称等</li>
            <li>订单信息：车牌号、预约时间、服务类型等</li>
            <li>位置信息：用于为您推荐附近的洗车门店</li>
          </ul>
        </section>

        <section>
          <h4>2. 信息使用</h4>
          <p>我们收集的信息将用于：</p>
          <ul>
            <li>提供洗车预约和支付服务</li>
            <li>改善用户体验和服务质量</li>
            <li>发送服务通知和优惠信息</li>
          </ul>
        </section>

        <section>
          <h4>3. 信息保护</h4>
          <p>我们采用行业标准的安全措施保护您的个人信息：</p>
          <ul>
            <li>数据加密传输和存储</li>
            <li>严格的访问权限控制</li>
            <li>定期安全审计和漏洞修复</li>
          </ul>
        </section>

        <section>
          <h4>4. 信息共享</h4>
          <p>除以下情况外，我们不会与第三方共享您的个人信息：</p>
          <ul>
            <li>获得您的明确同意</li>
            <li>法律法规要求</li>
            <li>为提供服务所必需的合作伙伴</li>
          </ul>
        </section>

        <section>
          <h4>5. 联系我们</h4>
          <p>如果您对本隐私政策有任何疑问，请通过以下方式联系我们：</p>
          <p>邮箱：privacy@carwash.com</p>
          <p>电话：400-123-4567</p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 组件逻辑
</script>

<style scoped>
.privacy-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.privacy-content {
  padding: 16px;
}

.policy-text {
  background: white;
  border-radius: 12px;
  padding: 20px;
  line-height: 1.6;
}

.policy-text h3 {
  margin: 0 0 8px 0;
  color: #323233;
  font-size: 20px;
}

.update-time {
  color: #969799;
  font-size: 14px;
  margin: 0 0 24px 0;
}

.policy-text section {
  margin-bottom: 24px;
}

.policy-text h4 {
  margin: 0 0 12px 0;
  color: #323233;
  font-size: 16px;
}

.policy-text p {
  margin: 0 0 8px 0;
  color: #646566;
}

.policy-text ul {
  margin: 8px 0;
  padding-left: 20px;
}

.policy-text li {
  margin: 4px 0;
  color: #646566;
}
</style>