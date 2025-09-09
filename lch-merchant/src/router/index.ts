import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { title: '商户登录', requiresAuth: false }
    },
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'Dashboard', 
      component: () => import('@/views/Dashboard.vue'),
      meta: { title: '仪表盘', requiresAuth: true }
    },
    {
      path: '/devices',
      name: 'Devices',
      component: () => import('@/views/Devices.vue'),
      meta: { title: '设备管理', requiresAuth: true }
    },
    {
      path: '/orders',
      name: 'Orders',
      component: () => import('@/views/Orders.vue'), 
      meta: { title: '订单管理', requiresAuth: true }
    },
    {
      path: '/finance',
      name: 'Finance',
      component: () => import('@/views/Finance.vue'),
      meta: { title: '财务中心', requiresAuth: true }
    },
    {
      path: '/customers',
      name: 'Customers',
      component: () => import('@/views/Customers.vue'),
      meta: { title: '客户管理', requiresAuth: true }
    },
    {
      path: '/marketing',
      name: 'Marketing',
      component: () => import('@/views/Marketing.vue'),
      meta: { title: '营销工具', requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/views/Settings.vue'),
      meta: { title: '设置', requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFound.vue'),
      meta: { title: '页面不存在' }
    }
  ]
})

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 亮车惠商户管理中心`
  }
  
  // 检查是否需要认证
  if (to.meta.requiresAuth !== false) {
    if (!authStore.isAuthenticated) {
      // 尝试从本地存储恢复登录状态
      await authStore.checkAuthStatus()
      
      if (!authStore.isAuthenticated) {
        ElMessage.warning('请先登录')
        next('/login')
        return
      }
    }
    
    // 检查是否是商户角色
    const userRole = authStore.userRole
    if (userRole && !['merchant_staff', 'merchant_admin'].includes(userRole)) {
      ElMessage.error('您没有权限访问商户管理系统')
      next('/login')
      return
    }
  }
  
  // 已登录用户访问登录页，重定向到仪表盘
  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/dashboard')
    return
  }
  
  next()
})

export default router
