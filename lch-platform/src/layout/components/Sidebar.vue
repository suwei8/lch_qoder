<template>
  <el-menu
    :default-active="activeMenu"
    :collapse="collapsed"
    :unique-opened="true"
    background-color="#001529"
    text-color="#fff"
    active-text-color="#1890ff"
    @select="handleMenuSelect"
  >
    <template v-for="route in menuRoutes" :key="route.path">
      <el-sub-menu 
        v-if="route.children && route.children.length > 0" 
        :index="route.path"
      >
        <template #title>
          <el-icon v-if="route.meta?.icon">
            <component :is="route.meta.icon" />
          </el-icon>
          <span>{{ route.meta?.title }}</span>
        </template>
        
        <el-menu-item 
          v-for="child in route.children" 
          :key="child.path"
          :index="child.path"
        >
          <el-icon v-if="child.meta?.icon">
            <component :is="child.meta.icon" />
          </el-icon>
          <span>{{ child.meta?.title }}</span>
        </el-menu-item>
      </el-sub-menu>
      
      <el-menu-item v-else :index="route.path">
        <el-icon v-if="route.meta?.icon">
          <component :is="route.meta.icon" />
        </el-icon>
        <span>{{ route.meta?.title }}</span>
      </el-menu-item>
    </template>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

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

// 获取菜单路由（过滤掉隐藏的路由）
const menuRoutes = computed(() => {
  const routes = router.getRoutes();
  const layoutRoute = routes.find(r => r.name === 'Layout');
  
  if (!layoutRoute?.children) return [];
  
  return layoutRoute.children
    .filter(route => !route.meta?.hidden)
    .map(route => ({
      path: route.path,
      name: route.name,
      meta: route.meta,
      children: route.children?.filter(child => !child.meta?.hidden) || [],
    }));
});

const handleMenuSelect = (path: string) => {
  if (path !== route.path) {
    router.push(path);
  }
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
      background-color: #1890ff !important;
    }
  }
  
  .el-menu-item.is-active {
    background-color: #1890ff !important;
    
    &::before {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: #1890ff;
    }
  }
}
</style>