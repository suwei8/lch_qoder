import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from 'unplugin-vue-components/resolvers'
import { visualizer } from 'rollup-plugin-visualizer'
import { compression } from 'vite-plugin-compression2'
import { createHtmlPlugin } from 'vite-plugin-html'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [
      vue(),
      AutoImport({
        resolvers: [VantResolver()],
        imports: ['vue', 'vue-router', 'pinia'],
        dts: true,
      }),
      Components({
        resolvers: [VantResolver()],
        dts: true,
      }),
      // HTML模板优化
      createHtmlPlugin({
        minify: isProduction,
        inject: {
          data: {
            title: '亮车惠 - 智能洗车服务',
            description: '24小时智能自助洗车服务平台',
            keywords: '洗车,自助洗车,智能洗车,24小时洗车',
          },
        },
      }),
      // 生产环境压缩
      ...(isProduction ? [
        compression({
          algorithm: 'gzip',
          exclude: [/\.(br|gz)$/, /\.(png|jpg|jpeg|svg)$/],
        }),
        compression({
          algorithm: 'brotliCompress',
          exclude: [/\.(br|gz)$/, /\.(png|jpg|jpeg|svg)$/],
        }),
        // 打包分析
        visualizer({
          filename: 'dist/bundle-analysis.html',
          open: false,
          gzipSize: true,
          brotliSize: true,
        }),
      ] : []),
    ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@views': resolve(__dirname, 'src/views'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@api': resolve(__dirname, 'src/api'),
      '@stores': resolve(__dirname, 'src/stores'),
    },
  },
  server: {
    port: 5604,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:5603',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: !isProduction,
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: isProduction,
        drop_debugger: isProduction,
      },
    },
    rollupOptions: {
      output: {
        // 智能代码分割
        manualChunks: (id) => {
          // node_modules 中的包
          if (id.includes('node_modules')) {
            // Vue 核心库
            if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
              return 'vue-vendor'
            }
            // UI 组件库
            if (id.includes('vant')) {
              return 'ui-vendor'
            }
            // 工具库
            if (id.includes('axios') || id.includes('dayjs') || id.includes('lodash')) {
              return 'utils-vendor'
            }
            // 其他第三方库
            return 'vendor'
          }
              
          // 业务代码分割
          if (id.includes('/src/views/')) {
            // 按页面模块分割
            if (id.includes('/user/')) return 'user-pages'
            if (id.includes('/order/')) return 'order-pages'
            if (id.includes('/payment/')) return 'payment-pages'
            if (id.includes('/vip/')) return 'vip-pages'
            return 'common-pages'
          }
              
          if (id.includes('/src/components/')) {
            return 'components'
          }
              
          if (id.includes('/src/utils/') || id.includes('/src/api/')) {
            return 'utils'
          }
        },
        // 文件命名策略
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk'
          return `js/[name]-[hash].js`
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)) {
            return `media/[name]-[hash].${ext}`
          }
          if (/\.(png|jpe?g|gif|svg)(\?.*)?$/i.test(assetInfo.name)) {
            return `images/[name]-[hash].${ext}`
          }
          if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
            return `fonts/[name]-[hash].${ext}`
          }
          return `assets/[name]-[hash].${ext}`
        },
      },
      // 外部依赖配置
      external: isProduction ? [] : [],
    },
    // 资源内联限制，小于 4KB 的文件会被内联为 base64
    assetsInlineLimit: 4096,
    // 大文件警告限制
    chunkSizeWarningLimit: 1000,
    // CSS 代码分割
    cssCodeSplit: true,
  },
  // 优化配置
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'vant',
      'axios',
    ],
    exclude: [
      // 排除不需要预构建的依赖
    ],
    // 实验性功能
    experimental: {
      renderBuiltUrl(filename, { hostType }) {
        if (hostType === 'js') {
          return { js: `/${filename}` }
        } else {
          return { relative: true }
        }
      },
    },
  }
})