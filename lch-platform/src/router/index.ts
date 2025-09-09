import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ElMessage } from 'element-plus';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// 扩展 RouteMeta 类型定义
declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    icon?: string;
    hidden?: boolean;
    requiresAuth?: boolean;
    roles?: 'user' | 'merchant_staff' | 'merchant_admin' | 'platform_admin' | ('user' | 'merchant_staff' | 'merchant_admin' | 'platform_admin')[];
  }
}

// 配置NProgress
NProgress.configure({ showSpinner: false });

const routes: RouteRecordRaw[] = [
  {
    path: '/test',
    name: 'Test',
    component: () => import('@/views/test.vue'),
    meta: { title: '测试页面', requiresAuth: false },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { title: '登录', requiresAuth: false },
  },
  {
    path: '/merchant-login',
    name: 'MerchantLogin',
    component: () => import('@/views/auth/merchant-login.vue'),
    meta: { title: '商户登录', requiresAuth: false },
  },
  {
    path: '/merchant',
    name: 'MerchantLayout',
    component: () => import('@/layout/merchant.vue'),
    redirect: '/merchant/dashboard',
    meta: { requiresAuth: true, roles: ['merchant_admin', 'merchant_staff'] },
    children: [
      {
        path: '/merchant/dashboard',
        name: 'MerchantDashboard',
        component: () => import('@/views/merchant/dashboard.vue'),
        meta: { title: '商户后台', icon: 'DataBoard' },
      },
      {
        path: '/merchant/devices',
        name: 'MerchantDevices',
        component: () => import('@/views/merchant/devices.vue'),
        meta: { title: '设备管理', icon: 'Monitor' },
      },
      {
        path: '/merchant/orders',
        name: 'MerchantOrders',
        component: () => import('@/views/merchant/orders.vue'),
        meta: { title: '订单管理', icon: 'Document' },
      },
      {
        path: '/merchant/finance',
        name: 'MerchantFinance',
        component: () => import('@/views/merchant/finance.vue'),
        meta: { title: '财务管理', icon: 'Money' },
      },
      {
        path: '/merchant/customers',
        name: 'MerchantCustomers',
        component: () => import('@/views/merchant/customers.vue'),
        meta: { title: '客户管理', icon: 'User' },
      },
      {
        path: '/merchant/marketing',
        name: 'MerchantMarketing',
        component: () => import('@/views/merchant/marketing.vue'),
        meta: { title: '营销工具', icon: 'Present' },
      },
      {
        path: '/merchant/reports',
        name: 'MerchantReports',
        component: () => import('@/views/merchant/reports.vue'),
        meta: { title: '数据报表', icon: 'DataAnalysis' },
      },
      {
        path: '/merchant/settings',
        name: 'MerchantSettings',
        component: () => import('@/views/merchant/settings.vue'),
        meta: { title: '商户设置', icon: 'Setting' },
      },
    ],
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
      {
        path: '/debug',
        name: 'Debug',
        component: () => import('@/views/debug.vue'),
        meta: { title: 'API调试', hidden: true },
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
router.beforeEach(async (to, _from, next) => {
  NProgress.start();
  
  const authStore = useAuthStore();
  
  // 设置页面标题
  if (to.meta.title) {
    if (to.path.startsWith('/merchant')) {
      document.title = `${to.meta.title} - 亮车惠商户管理后台`;
    } else {
      document.title = `${to.meta.title} - 亮车惠平台管理后台`;
    }
  }
  
  // 检查是否需要认证
  if (to.meta.requiresAuth !== false) {
    if (!authStore.isAuthenticated) {
      // 尝试从本地存储恢复登录状态
      await authStore.checkAuthStatus();
      
      if (!authStore.isAuthenticated) {
        // 根据用户类型重定向到不同的登录页
        if (to.path.startsWith('/merchant')) {
          next('/merchant-login');
        } else {
          next('/login');
        }
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
  if ((to.path === '/login' || to.path === '/merchant-login') && authStore.isAuthenticated) {
    const userRole = authStore.userRole;
    if (userRole === 'merchant_admin' || userRole === 'merchant_staff') {
      next('/merchant/dashboard');
    } else {
      next('/dashboard');
    }
    return;
  }
  
  next();
});

router.afterEach(() => {
  NProgress.done();
});

export default router;