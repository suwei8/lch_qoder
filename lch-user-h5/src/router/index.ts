import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'
import { showFailToast } from 'vant'

// 路由配置
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: {
      title: '首页',
      keepAlive: true,
      showTabbar: true
    }
  },
  {
    path: '/auth',
    name: 'Auth',
    component: () => import('@/views/Auth.vue'),
    meta: {
      title: '登录',
      showTabbar: false
    }
  },
  {
    path: '/stores',
    name: 'StoreList',
    component: () => import('@/views/StoreList.vue'),
    meta: {
      title: '门店列表',
      keepAlive: true,
      showTabbar: true
    }
  },
  {
    path: '/store/:id',
    name: 'StoreDetail',
    component: () => import('@/views/StoreDetail.vue'),
    meta: {
      title: '门店详情',
      showTabbar: false
    }
  },
  {
    path: '/device-control/:deviceId',
    name: 'DeviceControl',
    component: () => import('@/views/DeviceControl.vue'),
    meta: {
      title: '设备控制',
      requiresAuth: true,
      showTabbar: false
    }
  },
  {
    path: '/orders',
    name: 'OrderList',
    component: () => import('@/views/OrderList.vue'),
    meta: {
      title: '我的订单',
      requiresAuth: true,
      keepAlive: true,
      showTabbar: true
    }
  },
  {
    path: '/order/:id',
    name: 'OrderDetail',
    component: () => import('@/views/OrderDetail.vue'),
    meta: {
      title: '订单详情',
      requiresAuth: true,
      showTabbar: false
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: {
      title: '个人中心',
      requiresAuth: false,
      keepAlive: true,
      showTabbar: true
    }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/Search.vue'),
    meta: {
      title: '搜索',
      showTabbar: false
    }
  },
  {
    path: '/booking',
    name: 'Booking',
    component: () => import('@/views/Booking.vue'),
    meta: {
      title: '预约洗车',
      requiresAuth: true,
      showTabbar: false
    }
  },
  {
    path: '/membership',
    name: 'Membership',
    component: () => import('@/views/Membership.vue'),
    meta: {
      title: '会员中心',
      requiresAuth: true,
      showTabbar: false
    }
  },
  {
    path: '/coupons',
    name: 'CouponList',
    component: () => import('@/views/CouponList.vue'),
    meta: {
      title: '优惠券',
      requiresAuth: true,
      showTabbar: false
    }
  },
  {
    path: '/wallet',
    name: 'Wallet',
    component: () => import('@/views/Wallet.vue'),
    meta: {
      title: '我的钱包',
      requiresAuth: true,
      showTabbar: false
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/Settings.vue'),
    meta: {
      title: '设置',
      showTabbar: false
    }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/About.vue'),
    meta: {
      title: '关于我们',
      showTabbar: false
    }
  },
  {
    path: '/help',
    name: 'Help',
    component: () => import('@/views/Help.vue'),
    meta: {
      title: '帮助中心',
      showTabbar: false
    }
  },
  {
    path: '/feedback',
    name: 'Feedback',
    component: () => import('@/views/Feedback.vue'),
    meta: {
      title: '意见反馈',
      showTabbar: false
    }
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: () => import('@/views/Privacy.vue'),
    meta: {
      title: '隐私政策',
      showTabbar: false
    }
  },
  {
    path: '/terms',
    name: 'Terms',
    component: () => import('@/views/Terms.vue'),
    meta: {
      title: '服务条款',
      showTabbar: false
    }
  },
  {
    path: '/recharge-records',
    name: 'RechargeRecords',
    component: () => import('@/views/RechargeRecords.vue'),
    meta: {
      title: '充值记录',
      requiresAuth: false,
      showTabbar: false
    }
  },
  {
    path: '/balance-flow',
    name: 'BalanceFlow',
    component: () => import('@/views/BalanceFlow.vue'),
    meta: {
      title: '余额流水',
      requiresAuth: false,
      showTabbar: false
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: {
      title: '页面不存在',
      showTabbar: false
    }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL || '/'),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 全局前置守卫
router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()
  const appStore = useAppStore()

  // 显示加载状态
  appStore.setLoading(true)

  try {
    // 设置页面标题
    if (to.meta.title) {
      document.title = `${to.meta.title} - 智能洗车`
      appStore.setPageConfig({ 
        title: to.meta.title as string,
        showTabbar: to.meta.showTabbar !== false 
      })
    }

    // 检查是否需要登录
    if (to.meta.requiresAuth && !userStore.isLoggedIn) {
      showFailToast('请先登录')
      next({
        path: '/auth',
        query: { redirect: to.fullPath }
      })
      return
    }

    // 检查用户权限
    if (to.meta.requiresAuth && userStore.isLoggedIn) {
      // 检查用户状态是否正常
      if (userStore.user?.status === 'banned') {
        showFailToast('账户已被禁用，请联系客服')
        next('/profile')
        return
      }
    }

    // 特殊路由处理
    if (to.name === 'Auth' && userStore.isLoggedIn) {
      // 已登录用户访问登录页，重定向到首页
      next('/home')
      return
    }

    next()
  } catch (error) {
    console.error('路由守卫错误:', error)
    showFailToast('页面加载失败')
    next(false)
  }
})

// 全局后置守卫
router.afterEach((to, from) => {
  const appStore = useAppStore()
  
  // 隐藏加载状态
  appStore.setLoading(false)

  // 更新页面配置
  appStore.setPageConfig({
    showTabbar: to.meta.showTabbar !== false
  })

  // 页面访问统计
  if (import.meta.env.PROD) {
    // 可以在这里上报页面访问数据
    // analytics.trackPageView(to.path, to.meta.title)
  }

  // 开发环境日志
  if (import.meta.env.DEV) {
    console.log(`路由跳转: ${from.path} -> ${to.path}`)
  }
})

// 路由错误处理
router.onError((error) => {
  console.error('路由错误:', error)
  showFailToast('页面加载失败，请重试')
})

export default router