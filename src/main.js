// src/main.js

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import { useGlobalStore } from './stores/global'
// 导入 Vant 样式
import 'vant/lib/index.css'
import './assets/main.css'
import { Icon } from '@iconify/vue'

// 导入 IconFont 组件
import IconFont from './components/IconFont.vue'

// 引入 iconfont.cn Symbol 方式的 JS 文件
// 步骤：
// 1. 在 iconfont.cn 创建项目并添加图标
// 2. 选择 Symbol 方式，生成在线链接
// 3. 将链接粘贴到下方（去掉 https: 前缀，保留 //at.alicdn.com/...）
// 示例：import '//at.alicdn.com/t/font_xxxxx.js'
// 或者下载到本地，放在 public 或 assets 目录中
// import './assets/iconfont/iconfont.js'
// ⚠️ 请在下方添加你的 iconfont Symbol JS 文件引入：


// 导入 VConsole 插件
// import VConsole from 'vconsole'
// 💡 建议: 仅在开发环境启用 VConsole，生产环境应禁用
// if (import.meta.env.DEV) {
//   new VConsole()
// }
// 导入需要的 Vant 组件
import {
  Field,
  Button,
  Toast,
  Tag,
  CountDown,
  NoticeBar
} from 'vant'

// 1. 引入 Capacitor 核心和平台判断


async function initApp() {
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  app.use(router)
  // 注册 Iconify Icon 组件
  app.component('IconifyIcon', Icon)

  // 注册 IconFont 组件（用于 iconfont.cn Symbol 方式）
  app.component('IconFont', IconFont)

  // 注册 Vant 组件
  app.use(Field)
  app.use(Button)
  app.use(Toast)
  app.use(Tag)
  app.use(CountDown)
  app.use(NoticeBar)



  // 获取全局 store
  // 💡 建议: globalStore 在此处获取但未在组件中使用，需确认是否必需
  const globalStore = useGlobalStore()

  try {
    // 获取初始化数据
    await globalStore.fetchInitData()
    console.log('Global data fetched successfully')
  } catch (error) {
    console.error('Failed to fetch global data:', error)
    // 你可以在这里添加一些错误处理逻辑，比如显示一个错误提示
    Toast('初始化失败，请刷新页面重试')
  }

  // 挂载应用
  app.mount('#app')
}

// 调用初始化函数
initApp().catch((error) => {
  console.error('Failed to initialize app:', error)
})
