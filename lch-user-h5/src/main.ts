import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// 导入 Vant 样式
import 'vant/lib/index.css'
// 导入自定义样式
import '@/assets/styles/index.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')