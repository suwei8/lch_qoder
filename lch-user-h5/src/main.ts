import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// Vant UI 组件库
import {
  Button,
  NavBar,
  Tabbar,
  TabbarItem,
  Icon,
  Loading,
  Toast,
  Dialog,
  Notify,
  Overlay,
  Progress,
  Rate,
  Radio,
  RadioGroup,
  Popup,
  Field,
  Form,
  Cell,
  CellGroup,
  Image as VanImage,
  Lazyload,
  PullRefresh,
  List,
  Search,
  Tag,
  Badge,
  Divider,
  Empty,
  Skeleton,
  SkeletonTitle,
  SkeletonImage,
  SkeletonAvatar,
  SkeletonParagraph,
  ActionSheet,
  DatePicker,
  Picker,
  Area,
  Uploader,
  SwipeCell,
  Card,
  Grid,
  GridItem,
  IndexBar,
  IndexAnchor,
  Sidebar,
  SidebarItem,
  Steps,
  Step,
  Circle,
  CountDown,
  Swipe,
  SwipeItem,
  ImagePreview,
  ShareSheet,
  PasswordInput,
  NumberKeyboard,
  Calendar,
  Cascader,
  ContactCard,
  ContactEdit,
  ContactList,
  AddressEdit,
  AddressList,
  TreeSelect,
  Coupon,
  CouponCell,
  CouponList,
  SubmitBar
} from 'vant'

// 样式
import 'vant/lib/index.css'
import './assets/styles/index.css'

// 创建应用实例
const app = createApp(App)

// 注册 Vant 组件
const vantComponents = [
  Button,
  NavBar,
  Tabbar,
  TabbarItem,
  Icon,
  Loading,
  Toast,
  Dialog,
  Notify,
  Overlay,
  Progress,
  Rate,
  Radio,
  RadioGroup,
  Popup,
  Field,
  Form,
  Cell,
  CellGroup,
  VanImage,
  PullRefresh,
  List,
  Search,
  Tag,
  Badge,
  Divider,
  Empty,
  Skeleton,
  SkeletonTitle,
  SkeletonImage,
  SkeletonAvatar,
  SkeletonParagraph,
  ActionSheet,
  DatePicker,
  Picker,
  Area,
  Uploader,
  SwipeCell,
  Card,
  Grid,
  GridItem,
  IndexBar,
  IndexAnchor,
  Sidebar,
  SidebarItem,
  Steps,
  Step,
  Circle,
  CountDown,
  Swipe,
  SwipeItem,
  ShareSheet,
  PasswordInput,
  NumberKeyboard,
  Calendar,
  Cascader,
  ContactCard,
  ContactEdit,
  ContactList,
  AddressEdit,
  AddressList,
  TreeSelect,
  Coupon,
  CouponCell,
  CouponList,
  SubmitBar
]

vantComponents.forEach(component => {
  app.use(component)
})

// 注册图片懒加载
app.use(Lazyload, {
  loading: '/images/loading.png',
  error: '/images/error.png'
})

// 注册图片预览
app.use(ImagePreview)

// 创建 Pinia 实例
const pinia = createPinia()

// 注册插件
app.use(pinia)
app.use(router)

// 全局配置
app.config.globalProperties.$toast = Toast
app.config.globalProperties.$dialog = Dialog
app.config.globalProperties.$notify = Notify

// 全局错误处理
app.config.errorHandler = (err, _instance, info) => {
  console.error('全局错误:', err, info)
  
  // 在生产环境中可以上报错误
  if (import.meta.env.PROD) {
    // 上报错误到监控系统
    // reportError(err, info)
  }
}

// 全局警告处理
app.config.warnHandler = (msg, _instance, trace) => {
  console.warn('全局警告:', msg, trace)
}

// 初始化应用
const initApp = async () => {
  try {
    // 初始化应用状态
    const { useAppStore } = await import('./stores/app')
    const appStore = useAppStore()
    appStore.initApp()

    // 检查用户登录状态
    const { useUserStore } = await import('./stores/user')
    const userStore = useUserStore()
    // 初始化用户状态
    await userStore.checkAuthStatus()

    // 挂载应用
    app.mount('#app')
    
    console.log('应用初始化完成')
  } catch (error) {
    console.error('应用初始化失败:', error)
    
    // 显示错误提示
    Toast.fail('应用初始化失败，请刷新页面重试')
  }
}

// 启动应用
initApp()

// 开发环境调试信息
if (import.meta.env.DEV) {
  console.log('🚀 洗车H5应用启动')
  console.log('📱 设备信息:', navigator.userAgent)
  console.log('🌐 当前环境:', import.meta.env.MODE)
  console.log('🔗 API地址:', import.meta.env.VITE_API_BASE_URL)
}

// 性能监控
if (import.meta.env.PROD) {
  // 监控首屏加载时间
  window.addEventListener('load', () => {
    const loadTime = performance.now()
    console.log(`首屏加载时间: ${loadTime.toFixed(2)}ms`)
    
    // 可以上报到监控系统
    // reportPerformance('page_load_time', loadTime)
  })
}

export default app