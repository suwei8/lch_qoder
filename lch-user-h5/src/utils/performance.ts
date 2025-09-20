// 前端性能优化配置
export const performanceConfig = {
  // 图片懒加载配置
  lazyLoading: {
    threshold: 0.1, // 交叉比例
    rootMargin: '50px', // 提前加载距离
    placeholder: '/images/placeholder.svg', // 占位图
  },

  // 资源预加载配置
  preload: {
    // 关键路由预加载
    criticalRoutes: [
      '/',
      '/login',
      '/orders',
      '/user/profile'
    ],
    // 图片预加载
    criticalImages: [
      '/images/logo.png',
      '/images/banner.jpg'
    ],
    // 字体预加载
    fonts: [
      '/fonts/PingFangSC-Regular.woff2'
    ]
  },

  // 缓存策略配置
  cache: {
    // Service Worker 缓存策略
    strategies: {
      // 静态资源：缓存优先
      static: {
        pattern: /\.(css|js|woff2?|png|jpg|jpeg|svg)$/,
        strategy: 'CacheFirst',
        maxAge: 30 * 24 * 60 * 60 // 30天
      },
      // API请求：网络优先，缓存备用
      api: {
        pattern: /^https:\/\/api\./,
        strategy: 'NetworkFirst',
        maxAge: 5 * 60, // 5分钟
        maxEntries: 100
      },
      // HTML页面：网络优先
      pages: {
        pattern: /\.html$/,
        strategy: 'NetworkFirst',
        maxAge: 24 * 60 * 60 // 1天
      }
    }
  },

  // 代码分割配置
  codeSplitting: {
    // 路由级别分割
    routeChunks: {
      home: () => import('@/views/Home.vue'),
      user: () => import('@/views/User.vue'),
      orders: () => import('@/views/Orders.vue'),
      payment: () => import('@/views/Payment.vue'),
      vip: () => import('@/views/Vip.vue')
    },
    
    // 组件级别分割
    componentChunks: {
      // 大型组件异步加载
      Chart: () => import('@/components/Chart.vue'),
      DataTable: () => import('@/components/DataTable.vue'),
      RichEditor: () => import('@/components/RichEditor.vue')
    },

    // 工具库分割
    utilsChunks: {
      // lodash: () => import('lodash'),
      // dayjs: () => import('dayjs'),
      // echarts: () => import('echarts')
    }
  },

  // 资源优化配置
  optimization: {
    // 图片压缩配置
    imageCompression: {
      jpeg: { quality: 80 },
      png: { quality: 80 },
      webp: { quality: 80 }
    },

    // CSS优化
    css: {
      purge: true, // 清除未使用的CSS
      minify: true, // 压缩CSS
      extract: true // 提取CSS到单独文件
    },

    // JavaScript优化
    js: {
      minify: true, // 压缩JS
      treeshake: true, // Tree shaking
      removeConsole: true, // 移除console
      removeDebugger: true // 移除debugger
    }
  },

  // 监控配置
  monitoring: {
    // 性能指标监控
    metrics: {
      FCP: { threshold: 1800 }, // First Contentful Paint
      LCP: { threshold: 2500 }, // Largest Contentful Paint
      FID: { threshold: 100 },  // First Input Delay
      CLS: { threshold: 0.1 },  // Cumulative Layout Shift
      TTFB: { threshold: 800 }  // Time to First Byte
    },

    // 错误监控
    errorTracking: {
      enabled: true,
      sampleRate: 0.1, // 10%采样率
      maxErrors: 50    // 最大错误数
    },

    // 用户行为监控
    userTracking: {
      pageViews: true,
      clicks: true,
      formSubmissions: true,
      apiCalls: true
    }
  }
}

// 性能优化工具函数
export const performanceUtils = {
  // 图片懒加载
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            img.src = img.dataset.src || ''
            img.classList.remove('lazy')
            observer.unobserve(img)
          }
        })
      }, {
        threshold: performanceConfig.lazyLoading.threshold,
        rootMargin: performanceConfig.lazyLoading.rootMargin
      })

      document.querySelectorAll('img[data-src]').forEach(img => {
        observer.observe(img)
      })
    }
  },

  // 预加载关键资源
  preloadCriticalResources() {
    // 预加载关键CSS
    const criticalCSS = document.createElement('link')
    criticalCSS.rel = 'preload'
    criticalCSS.as = 'style'
    criticalCSS.href = '/css/critical.css'
    document.head.appendChild(criticalCSS)

    // 预加载关键字体
    performanceConfig.preload.fonts.forEach(font => {
      const fontLink = document.createElement('link')
      fontLink.rel = 'preload'
      fontLink.as = 'font'
      fontLink.crossOrigin = 'anonymous'
      fontLink.href = font
      document.head.appendChild(fontLink)
    })
  },

  // 动态导入组件
  dynamicImport(componentName: string) {
    const chunks = performanceConfig.codeSplitting.componentChunks
    return chunks[componentName as keyof typeof chunks] ? chunks[componentName as keyof typeof chunks]() : null
  },

  // 性能监控
  measurePerformance() {
    if ('PerformanceObserver' in window) {
      // 监控LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        console.log('LCP:', lastEntry.startTime)
      }).observe({ entryTypes: ['largest-contentful-paint'] })

      // 监控FID
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          console.log('FID:', entry.processingStart - entry.startTime)
        })
      }).observe({ entryTypes: ['first-input'] })

      // 监控CLS
      new PerformanceObserver((list) => {
        let clsValue = 0
        const entries = list.getEntries()
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
          }
        })
        console.log('CLS:', clsValue)
      }).observe({ entryTypes: ['layout-shift'] })
    }
  },

  // 资源优化
  optimizeImages() {
    // 为图片添加loading="lazy"属性
    document.querySelectorAll('img').forEach(img => {
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy')
      }
    })

    // 使用WebP格式（如果支持）
    const supportsWebP = (callback: (supported: boolean) => void) => {
      const img = new Image()
      img.onload = () => callback(true)
      img.onerror = () => callback(false)
      img.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA'
    }

    supportsWebP((supported) => {
      if (supported) {
        document.querySelectorAll('img[data-webp]').forEach(img => {
          const imgElement = img as HTMLImageElement
          imgElement.src = imgElement.dataset.webp || imgElement.src
        })
      }
    })
  },

  // 内存优化
  optimizeMemory() {
    // 清理未使用的事件监听器
    window.addEventListener('beforeunload', () => {
      // 清理定时器
      const highestTimeoutId = setTimeout(() => {}, 0)
      for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i)
      }

      // 清理interval
      const highestIntervalId = setInterval(() => {}, 0)
      for (let i = 0; i < highestIntervalId; i++) {
        clearInterval(i)
      }
    })
  }
}

// 初始化性能优化
export const initPerformanceOptimization = () => {
  // 等待DOM加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      performanceUtils.setupLazyLoading()
      performanceUtils.preloadCriticalResources()
      performanceUtils.optimizeImages()
      performanceUtils.measurePerformance()
      performanceUtils.optimizeMemory()
    })
  } else {
    performanceUtils.setupLazyLoading()
    performanceUtils.preloadCriticalResources()
    performanceUtils.optimizeImages()
    performanceUtils.measurePerformance()
    performanceUtils.optimizeMemory()
  }
}