<template>
  <el-menu
    :default-active="activeMenu"
    :collapse="collapsed"
    :unique-opened="true"
    background-color="#001529"
    text-color="#fff"
    active-text-color="#52c41a"
    @select="handleMenuSelect"
  >
    <template v-for="menuItem in merchantMenus" :key="menuItem.path">
      <el-sub-menu 
        v-if="menuItem.children && menuItem.children.length > 0" 
        :index="menuItem.path"
      >
        <template #title>
          <el-icon v-if="menuItem.icon">
            <component :is="menuItem.icon" />
          </el-icon>
          <span>{{ menuItem.title }}</span>
        </template>
        
        <el-menu-item 
          v-for="child in menuItem.children" 
          :key="child.path"
          :index="child.path"
        >
          <el-icon v-if="child.icon">
            <component :is="child.icon" />
          </el-icon>
          <span>{{ child.title }}</span>
        </el-menu-item>
      </el-sub-menu>
      
      <el-menu-item v-else :index="menuItem.path">
        <el-icon v-if="menuItem.icon">
          <component :is="menuItem.icon" />
        </el-icon>
        <span>{{ menuItem.title }}</span>
      </el-menu-item>
    </template>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

interface Props {
  collapsed?: boolean;
}

defineProps<Props>();

const route = useRoute();
const router = useRouter();

// 计算当前激活的菜单项
const activeMenu = computed(() => {
  return route.path;
});

// 商户专属菜单配置
const merchantMenus = [
  {
    path: '/merchant/dashboard',
    title: '仪表盘',
    icon: 'DataBoard',
  },
  {
    path: '/merchant/devices',
    title: '设备管理',
    icon: 'Monitor',
  },
  {
    path: '/merchant/orders',
    title: '订单管理',
    icon: 'Document',
  },
  {
    path: '/merchant/finance',
    title: '财务管理',
    icon: 'Money',
  },
  {
    path: '/merchant/customers',
    title: '客户管理',
    icon: 'User',
  },
  {
    path: '/merchant/marketing',
    title: '营销工具',
    icon: 'Present',
  },
  {
    path: '/merchant/reports',
    title: '数据报表',
    icon: 'DataAnalysis',
  },
  {
    path: '/merchant/settings',
    title: '商户设置',
    icon: 'Setting',
  },
];

const handleMenuSelect = (path: string) => {
  if (path !== route.path) {
    // 检查路由是否存在
    const allRoutes = router.getRoutes();
    const targetRoute = allRoutes.find(r => r.path === path);
    
    if (targetRoute) {
      router.push(path);
    } else {
      // 如果路由不存在，显示开发中提示
      ElMessage.info(`${getMenuTitle(path)} 功能开发中，敬请期待`);
    }
  }
};

const getMenuTitle = (path: string) => {
  const menu = merchantMenus.find(m => m.path === path);
  return menu?.title || '功能';
};
</script>

<style lang="scss" scoped>
.el-menu {
  border-right: none;
  height: 100%;
  
  .el-menu-item,
  .el-sub-menu__title {
    height: 50px;
    line-height: 50px;
    
    &:hover {
      background-color: #52c41a !important;
    }
  }
  
  .el-menu-item.is-active {
    background-color: #52c41a !important;
    
    &::before {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: #52c41a;
    }
  }
  
  .el-sub-menu.is-active > .el-sub-menu__title {
    color: #52c41a !important;
  }
}
</style>