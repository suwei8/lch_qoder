import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// 配置NProgress
NProgress.configure({ showSpinner: false });

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '仪表盘', icon: 'DataBoard' },
      },
      {
        path: '/merchants',
        name: 'Merchants',
        component: () => import('@/views/merchants/index.vue'),
        meta: { title: '商户管理', icon: 'Shop' },
      },
      {
        path: '/merchants/:id',
        name: 'MerchantDetail',
        component: () => import('@/views/merchants/detail.vue'),
        meta: { title: '商户详情', hidden: true },
      },
      {
        path: '/devices',
        name: 'Devices',
        component: () => import('@/views/devices/index.vue'),
        meta: { title: '设备管理', icon: 'Monitor' },
      },
      {
        path: '/orders',
        name: 'Orders',
        component: () => import('@/views/orders/index.vue'),
        meta: { title: '订单管理', icon: 'Document' },
      },
      {
        path: '/users',
        name: 'Users',
        component: () => import('@/views/users/index.vue'),
        meta: { title: '用户管理', icon: 'User' },
      },
      {
        path: '/finance',
        name: 'Finance',
        component: () => import('@/views/finance/index.vue'),
        meta: { title: '财务管理', icon: 'Money' },
      },
      {
        path: '/system',
        name: 'System',
        meta: { title: '系统管理', icon: 'Setting' },
        children: [
          {
            path: '/system/config',
            name: 'SystemConfig',
            component: () => import('@/views/system/config.vue'),
            meta: { title: '系统配置' },
          },
          {
            path: '/system/logs',
            name: 'SystemLogs',
            component: () => import('@/views/system/logs.vue'),
            meta: { title: '系统日志' },
          },
        ],
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { title: '页面不存在' },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫
router.beforeEach(async (to, from, next) => {
  NProgress.start();
  
  const authStore = useAuthStore();
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 亮车惠平台管理后台`;
  }
  
  // 检查是否需要认证
  if (to.meta.requiresAuth !== false) {
    if (!authStore.isAuthenticated) {
      // 尝试从本地存储恢复登录状态
      await authStore.checkAuthStatus();
      
      if (!authStore.isAuthenticated) {
        next('/login');
        return;
      }
    }
    
    // 检查权限
    if (to.meta.roles && !authStore.hasRole(to.meta.roles)) {
      ElMessage.error('权限不足');
      next('/dashboard');
      return;
    }
  }
  
  // 已登录用户访问登录页，重定向到首页
  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard');
    return;
  }
  
  next();
});

router.afterEach(() => {
  NProgress.done();
});

export default router;