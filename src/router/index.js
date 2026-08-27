import { createRouter, createWebHashHistory } from 'vue-router'
import UserSettingsRoutes from '@/views/UserSettings/routes.js'


const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/FarmView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/farm-100',
      name: 'farm-100',
      component: () => import('../views/FarmView100.vue'),
      meta: { requiresAuth: true },
    },
    ...UserSettingsRoutes,
  ],
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 💡 建议: 直接读取 localStorage 而非使用 store，可能导致状态不一致
  // 💡       建议改为: import { useUserStore } from '../stores/user'
  // 💡       const userStore = useUserStore()
  // 💡       const isAuthenticated = !!userStore.token
  const isAuthenticated = localStorage.getItem('user-token')
  const isVisitor = localStorage.getItem('visitor_id')

  // 如果用户已认证且访问登录页，自动跳转到首页
  if (to.path === '/login' && isAuthenticated) {
    next('/')
    return
  }

  // 如果需要认证但未登录，检查是否有游客身份
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!isAuthenticated && !isVisitor) {
      next('/login')
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
