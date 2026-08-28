import { createRouter, createWebHashHistory } from 'vue-router'
import { currentUiPack } from '@/config/ui'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: currentUiPack.farm,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: currentUiPack.login,
    },
    {
      path: '/userSettings/statistics',
      name: 'sUserSetting',
      component: currentUiPack.settings,
      meta: { requiresAuth: true },
    },
    {
      path: '/farm-1',
      redirect: '/',
    },
    {
      path: '/farm-2',
      redirect: '/',
    },
    {
      path: '/farm-3',
      redirect: '/',
    },
    {
      path: '/farm-100',
      redirect: '/',
    },
  ],
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('user-token')
  const isVisitor = localStorage.getItem('visitor_id')

  if (to.path === '/login' && isAuthenticated) {
    next('/')
    return
  }

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
