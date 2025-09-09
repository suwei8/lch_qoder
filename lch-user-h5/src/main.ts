import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// 导入 Vant 样式
import 'vant/lib/index.css'
// 导入自定义样式
import '@/assets/styles/index.css'

// 导入Vant组件（按需导入主要组件）
import { 
  Button, 
  NavBar, 
  Tabbar, 
  TabbarItem,
  Cell,
  CellGroup,
  Icon,
  Toast,
  Dialog,
  Loading,
  List,
  PullRefresh,
  Search,
  Tab,
  Tabs,
  Field,
  Form,
  Image as VanImage
} from 'vant'

const app = createApp(App)

// 注册Vant组件
app.use(Button)
app.use(NavBar)
app.use(Tabbar)
app.use(TabbarItem)
app.use(Cell)
app.use(CellGroup)
app.use(Icon)
app.use(Toast)
app.use(Dialog)
app.use(Loading)
app.use(List)
app.use(PullRefresh)
app.use(Search)
app.use(Tab)
app.use(Tabs)
app.use(Field)
app.use(Form)
app.use(VanImage)

app.use(createPinia())
app.use(router)

app.mount('#app')