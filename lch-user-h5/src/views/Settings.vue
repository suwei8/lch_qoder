<template>
  <div class="settings-page">
    <van-nav-bar
      title="设置"
      left-text="返回"
      left-arrow
      @click-left="$router.back()"
    />

    <div class="settings-content">
      <van-cell-group title="账户设置">
        <van-cell title="修改密码" is-link />
        <van-cell title="绑定手机" is-link />
        <van-cell title="实名认证" is-link />
      </van-cell-group>

      <van-cell-group title="通用设置">
        <van-cell title="消息通知">
          <template #right-icon>
            <van-switch v-model="notificationEnabled" />
          </template>
        </van-cell>
        <van-cell title="自动定位">
          <template #right-icon>
            <van-switch v-model="locationEnabled" />
          </template>
        </van-cell>
      </van-cell-group>

      <van-cell-group title="其他">
        <van-cell title="清除缓存" is-link @click="clearCache" />
        <van-cell title="关于我们" is-link @click="goToAbout" />
        <van-cell title="隐私政策" is-link @click="goToPrivacy" />
      </van-cell-group>

      <div class="logout-section">
        <van-button type="danger" block @click="logout">退出登录</van-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Toast, Dialog } from 'vant'

const router = useRouter()
const notificationEnabled = ref(true)
const locationEnabled = ref(true)

const clearCache = async () => {
  await Dialog.confirm({
    title: '清除缓存',
    message: '确定要清除所有缓存数据吗？'
  })
  Toast.success('缓存已清除')
}

const goToAbout = () => {
  router.push('/about')
}

const goToPrivacy = () => {
  router.push('/privacy')
}

const logout = async () => {
  await Dialog.confirm({
    title: '退出登录',
    message: '确定要退出登录吗？'
  })
  // TODO: 实现退出登录逻辑
  Toast.success('已退出登录')
  router.push('/auth')
}
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.settings-content {
  padding: 16px;
}

.logout-section {
  margin-top: 32px;
}
</style>