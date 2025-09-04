<template>
  <div class="layout-container">
    <div class="layout-header">
      <div class="header-left">
        <el-icon class="menu-trigger" @click="toggleSidebar">
          <Menu />
        </el-icon>
        <h1 class="app-title">亮车惠 · 平台管理后台</h1>
      </div>
      
      <div class="header-right">
        <el-dropdown @command="handleUserAction">
          <div class="user-info">
            <el-avatar 
              :src="authStore.currentUser?.avatar" 
              :size="32"
              class="user-avatar"
            >
              {{ authStore.currentUser?.nickname?.charAt(0) || 'U' }}
            </el-avatar>
            <span class="user-name">{{ authStore.currentUser?.nickname || '用户' }}</span>
            <el-icon><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人设置</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    
    <div class="layout-main">
      <div class="layout-sidebar" :class="{ collapsed: sidebarCollapsed }">
        <Sidebar />
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
import Sidebar from './components/Sidebar.vue';

const router = useRouter();
const authStore = useAuthStore();

const sidebarCollapsed = ref(false);

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

const handleUserAction = async (command: string) => {
  switch (command) {
    case 'profile':
      // TODO: 打开个人设置页面
      break;
    case 'logout':
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      });
      await authStore.logout();
      router.push('/login');
      break;
  }
};
</script>

<style lang="scss" scoped>
.layout-header {
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
        color: #1890ff;
      }
    }
    
    .app-title {
      font-size: 20px;
      font-weight: 600;
      color: #1890ff;
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

.layout-sidebar {
  width: 220px;
  transition: width 0.3s;
  
  &.collapsed {
    width: 64px;
  }
}
</style>