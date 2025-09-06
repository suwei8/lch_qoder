<template>
  <div class="layout-container">
    <div class="layout-header">
      <div class="header-left">
        <el-icon class="menu-trigger" @click="toggleSidebar">
          <Menu />
        </el-icon>
        <h1 class="app-title">亮车惠 · 商户管理后台</h1>
      </div>
      
      <div class="header-right">
        <el-dropdown @command="handleUserAction">
          <div class="user-info">
            <el-avatar 
              :src="authStore.currentUser?.avatar" 
              :size="32"
              class="user-avatar"
            >
              {{ authStore.currentUser?.nickname?.charAt(0) || 'M' }}
            </el-avatar>
            <span class="user-name">{{ authStore.currentUser?.nickname || '商户' }}</span>
            <el-icon><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">商户信息</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    
    <div class="layout-main">
      <div class="layout-sidebar" :class="{ collapsed: sidebarCollapsed }">
        <MerchantSidebar />
      </div>
      
      <div class="layout-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ElMessageBox } from 'element-plus';
import MerchantSidebar from './components/MerchantSidebar.vue';

const router = useRouter();
const authStore = useAuthStore();

const sidebarCollapsed = ref(false);

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

const handleUserAction = async (command: string) => {
  switch (command) {
    case 'profile':
      // TODO: 打开商户信息页面
      break;
    case 'logout':
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      });
      await authStore.logout();
      router.push('/merchant-login');
      break;
  }
};
</script>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-header {
  height: 64px;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  
  .header-left {
    display: flex;
    align-items: center;
    
    .menu-trigger {
      font-size: 18px;
      cursor: pointer;
      margin-right: 16px;
      color: #666;
      
      &:hover {
        color: #52c41a;
      }
    }
    
    .app-title {
      font-size: 20px;
      font-weight: 600;
      color: #52c41a;
      margin: 0;
    }
  }
  
  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 4px;
      
      &:hover {
        background: #f5f5f5;
      }
      
      .user-avatar {
        margin-right: 8px;
      }
      
      .user-name {
        margin-right: 8px;
        color: #333;
      }
    }
  }
}

.layout-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.layout-sidebar {
  width: 220px;
  transition: width 0.3s;
  background: #001529;
  
  &.collapsed {
    width: 64px;
  }
}

.layout-content {
  flex: 1;
  overflow: auto;
  background: #f0f2f5;
}
</style>