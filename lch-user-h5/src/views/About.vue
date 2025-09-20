<template>
  <div class="about-page">
    <van-nav-bar
      title="关于我们"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
    />

    <div class="about-content">
      <div class="app-info">
        <div class="app-logo">
          <van-image
            src="/logo.png"
            width="80"
            height="80"
            fit="contain"
          />
        </div>
        <h2>智能洗车</h2>
        <p class="version">版本 v1.0.0</p>
      </div>

      <div class="company-info">
        <h3>公司介绍</h3>
        <p>我们致力于为用户提供便捷、高效的智能洗车服务，通过先进的物联网技术和移动互联网平台，让洗车变得更加简单。</p>
      </div>

      <van-cell-group title="联系我们">
        <van-cell title="客服电话" value="400-123-4567" />
        <van-cell title="官方邮箱" value="service@carwash.com" />
        <van-cell title="公司地址" value="北京市朝阳区xxx街道xxx号" />
      </van-cell-group>
    </div>
  </div>
</template>

<script setup lang="ts">
// 组件逻辑
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.about-content {
  padding: 16px;
}

.app-info {
  text-align: center;
  padding: 32px 0;
  background: white;
  border-radius: 12px;
  margin-bottom: 20px;
}

.app-logo {
  margin-bottom: 16px;
}

.app-info h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #323233;
}

.version {
  color: #969799;
  margin: 0;
}

.company-info {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.company-info h3 {
  margin: 0 0 12px 0;
  color: #323233;
}

.company-info p {
  color: #646566;
  line-height: 1.6;
  margin: 0;
}
</style>