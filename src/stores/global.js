// src/stores/global.js
import { defineStore } from 'pinia'
import { globalApi } from '../api/global'

export const useGlobalStore = defineStore('global', {
  state: () => ({
    initData: JSON.parse(localStorage.getItem('initData')) || null,
    isLoading: false,
    APP_NAME: import.meta.env.VITE_APP_NAME,
    API_URL: import.meta.env.VITE_API_URL,
    APP_ENV: import.meta.env.VITE_APP_ENV,
    APP_VERSION: '1.0.0',
    FARM_NAME: import.meta.env.VITE_APP_NAME
  }),
  actions: {
    async fetchInitData() {
      this.isLoading = true
      try {
        const response = await globalApi.getInitData()
        this.initData = response
        // 永久存储初始化数据
        localStorage.setItem('initData', JSON.stringify(response))
      } catch (error) {
        console.error('Failed to fetch init data:', error)
      } finally {
        this.isLoading = false
      }
    },
  },
})
