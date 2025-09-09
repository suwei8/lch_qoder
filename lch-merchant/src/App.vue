<template>
  <div id="app">
    <div v-if="!isLoginPage" class="app-layout">
      <!-- 导航栏 -->
      <el-header class="app-header">
        <div class="header-left">
          <div class="logo">
            <span class="logo-icon">🏪</span>
            <span class="logo-text">商户管理中心</span>
          </div>
        </div>
        <div class="header-right">
          <!-- 网络状态指示器 -->
          <div v-if="showOfflineNotice" class="network-status">
            <el-icon class="network-icon"><Connection /></el-icon>
            <span class="network-text">{{ networkStatus }}</span>
          </div>
          
          <el-dropdown @command="handleUserMenuCommand">
            <div class="user-info">
              <span class="user-name">{{ userInfo?.nickname || '商户用户' }}</span>
              <el-icon class="user-avatar"><User /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <!-- 侧边导航 -->
      <el-container class="app-container">
        <el-aside class="app-aside">
          <el-menu
            :default-active="$route.path"
            class="sidebar-menu"
            router
          >
            <el-menu-item index="/dashboard">
              <el-icon><DataBoard /></el-icon>
              <span>仪表盘</span>
            </el-menu-item>
            <el-menu-item index="/devices">
              <el-icon><Monitor /></el-icon>
              <span>设备管理</span>
            </el-menu-item>
            <el-menu-item index="/orders">
              <el-icon><Document /></el-icon>
              <span>订单管理</span>
            </el-menu-item>
            <el-menu-item index="/finance">
              <el-icon><Money /></el-icon>
              <span>财务中心</span>
            </el-menu-item>
            <el-menu-item index="/customers">
              <el-icon><User /></el-icon>
              <span>客户管理</span>
            </el-menu-item>
            <el-menu-item index="/marketing">
              <el-icon><Present /></el-icon>
              <span>营销工具</span>
            </el-menu-item>
            <el-menu-item index="/settings">
              <el-icon><Setting /></el-icon>
              <span>设置</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        
        <!-- 主内容区域 -->
        <el-main class="app-main">
          <RouterView />
        </el-main>
      </el-container>
    </div>
    
    <!-- 登录页面直接显示 -->
    <div v-else>
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  DataBoard,
  Monitor,
  Document,
  Money,
  User,
  Present,
  Setting,
  Connection
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { useSystemStore } from '@/stores/system'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const systemStore = useSystemStore()

// 检查是否是登录页面
const isLoginPage = computed(() => route.path === '/login')

// 用户信息
const userInfo = computed(() => authStore.userInfo)

// 网络状态
const showOfflineNotice = computed(() => systemStore.showOfflineNotice)
const networkStatus = computed(() => systemStore.networkStatus)

// 用户菜单操作
const handleUserMenuCommand = (command: string) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人信息功能开发中')
      break
    case 'logout':
      authStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
      break
  }
}

onMounted(async () => {
  try {
    // 初始化网络监听
    systemStore.initNetworkListener()
    
    // 初始化应用，检查登录状态
    await authStore.checkAuthStatus()
  } catch (error) {
    console.warn('检查认证状态失败，但不影响应用启动:', error)
  }
})
</script>

<style scoped>
#app {
  height: 100vh;
  overflow: hidden;
}

.app-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 32px;
}

.logo-text {
  font-size: 20px;
  font-weight: 600;
  color: #52c41a;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.network-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: #fff2e8;
  border: 1px solid #ffab91;
  border-radius: 6px;
  font-size: 12px;
  color: #ff6b35;
}

.network-icon {
  font-size: 14px;
}

.network-text {
  font-weight: 500;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-name {
  color: #303133;
  font-weight: 500;
}

.user-avatar {
  font-size: 20px;
  color: #909399;
}

.app-container {
  flex: 1;
  height: calc(100vh - 60px);
}

.app-aside {
  background: white;
  border-right: 1px solid #e4e7ed;
  width: 200px;
  overflow: hidden;
}

.sidebar-menu {
  border: none;
  height: 100%;
}

.sidebar-menu .el-menu-item {
  height: 56px;
  line-height: 56px;
}

.sidebar-menu .el-menu-item.is-active {
  background-color: #e6f7ff;
  color: #1890ff;
  border-right: 3px solid #1890ff;
}

.app-main {
  background-color: #f5f7fa;
  padding: 0;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-aside {
    width: 160px;
  }
  
  .logo-text {
    display: none;
  }
  
  .user-name {
    display: none;
  }
}</style>
