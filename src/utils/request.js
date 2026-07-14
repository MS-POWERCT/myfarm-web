// src/utils/request.js

import axios from 'axios'
import { showToast, showDialog, showConfirmDialog } from 'vant'
import { useUserStore } from '../stores/user'
import { deviceType } from './device'
import router from '../router'
// import { showConfirmDialog } from './dialog'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers['Authorization'] = `Bearer ${userStore.token}`
    }
    if(deviceType) {
      config.headers['device_type'] = deviceType
    }
    config.headers['app_name'] = import.meta.env.VITE_APP_NAME_EN

    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  },
)
// 响应拦截器
service.interceptors.response.use(
  (response) => {

    const res = response.data
    // 检查res是否为对象
    if (typeof res !== 'object' || res === null) {
      return res
    }

    if ('res_code' in res) {
      if (res.res_code === 6200) {
        // 需要绑定邮箱或地址，跳转到登录管理页面
        // showConfirmDialog({
        //   title: '需要完善账户',
        //   message: res.res_msg || '请先绑定邮箱或地址以继续操作',
        //   icon: 'streamline-stickies-color:user-circle-question',
        //   iconClass: 'icon-warning'
        // }).then(() => {
        //   router.push('/userSettings/statistics')
        // })
        return Promise.reject(res.res_msg || '需要绑定邮箱或地址')
      } else if (res.res_code !== 0) {
        // 如果配置了 silent，则不显示错误提示
        if (!response.config.silent) {
          showToast(res.res_msg || 'Error')
        }
        return Promise.reject(res.res_msg || 'Error')
      } else {
        return res.data
      }
    } else {
      return res
    }
  },
  (error) => {
    // 如果是401错误，弹出提示框并跳转到登录页面
    if (error.response && error.response.status === 401) {
      showDialog({
        title: '会话已过期',
        message: '请重新登录',
      }).then(() => {
        const userStore = useUserStore()
        userStore.logout()
        window.location.reload()
      })
    } else if (error.response && error.response.status === 429) {
      showToast('请求过于频繁，请稍后再试')
    }else{
      console.error('Response error:', error)
      showToast(error.message || 'Request failed')
      return Promise.reject(error)
    }
  },
)

export default service
