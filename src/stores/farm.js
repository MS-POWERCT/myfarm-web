  import { defineStore } from 'pinia'
  import { farmApi } from '../api/farm'

  export const useFarmStore = defineStore('farm', {
    state: () => ({
      info: null, // 使用 null 初始化，避免类型混乱
      loading: false,
      lands: [], // 土地列表
      shops: [], // 商店列表
      seedList: [], // 仓库列表（种子）
      fruitList: [], // 仓库列表（水果）
      toolList: [], // 仓库列表（工具）
      marketList: [], // 仓库列表（集市）
      landUpgradeInfo: [], // 土地升级/开垦信息（土地）
      specialInfo: [], // 特殊建筑基础信息（世界）
      deliveryToolList: [], // 配送工具列表
      isHaveDeliveryTool: false, // 是否有配送工具可用
    }),
    actions: {
      async fetchFarmInfo() {
        try {
          this.loading = true
          const response = await farmApi.initFarm()
          this.info = response || null
          return response
        } catch (error) {
          console.error('获取农场信息失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },
      // 获取土地信息
      async fetchLands() {
        try {
          this.loading = true
          const response = await farmApi.getLandList() || []
          this.lands = response
          return response
        } catch (error) {
          console.error('获取土地信息失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },
      // 种植土地
      async plant(data){
        try {
          this.loading = true
          const response = await farmApi.plant(data) || []
          this.lands = response
          return response
        } catch (error) {
          console.error('种植土地失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },// 一键种植土地
      async plantAll(data){
        try {
          this.loading = true
          const response = await farmApi.plantAll(data) || []
          this.lands = response
          return response
        } catch (error) {
          console.error('一键种植土地失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },
      // 铲除土地
      async landRemove(data){
        try {
          this.loading = true
          const response = await farmApi.remove(data) || []
          this.lands = response
          return response
        } catch (error) {
          console.error('移除土地失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },
      // 一键铲除所有土地
      async LandRemoveAll(){
           try {
          this.loading = true
          const response = await farmApi.removeAll() || []
          this.lands = response
          return response
        } catch (error) {
          console.error('一键铲除所有土地失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },
      //刷新
      async LandRefresh(land_id){
         try {
          this.loading = true
          const response = await farmApi.refresh({ land_id: land_id }) || []
          this.lands = response
          return response
        } catch (error) {
          console.error('刷新土地失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },
      // 收获
      async LandHarvest(land_id){
        try {
          this.loading = true
          const response = await farmApi.harvest({ land_id: land_id }) || []
          this.lands = response
          return response
        } catch (error) {
          console.error('收获土地失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },
      // 一键收获
      async LandHarvestAll(){
        try {
          this.loading = true
          const response = await farmApi.harvestAll() || []
          this.lands = response
          return response
        } catch (error) {
          console.error('收获土地失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },
      // 获取商店信息
      async fetchShops(data) {
        try {
          this.loading = true
          const response = await farmApi.getShopList(data) || []
          this.shops = response
          return response
        } catch (error) {
          console.error('获取商店信息失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },
      // 购买商品（包含API调用和状态更新逻辑）
      async shopBuy(item, num) {
        try {
          this.loading = true
          // 调用API购买
         await farmApi.shopBuy({
            id: item.id,
            num: num
          })
          return { success: true }
        } catch (error) {
          console.error('购买商店商品失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },
      // 获取仓库列表
      async fetchWarehouseList(type) {
        try {
          this.loading = true
          const response = await farmApi.getWarehouseList({ type: type }) || []
          this[`${type}List`] = response || []
          return response
        } catch (error) {
          console.error('获取仓库列表失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },
      // 扩充仓库
      async extendWarehouse(){
        try {
          this.loading = true
          await farmApi.extendWarehouse() || []
        } catch (error) {
          console.error('扩充仓库失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },
      // 获取集市列表
      async fetchMarketList(data) {
        try {
          this.loading = true
          const response = await farmApi.getMarketList(data) || []
          this.marketList = response || []
          return response
        } catch (error) {
          console.error('获取集市列表失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },
      // 交付集市任务
      async deliverTask(task_id) {
        try {
          this.loading = true
          const response = await farmApi.deliverTask({ id: task_id }) || []
          this.marketList = response || []
          return response
        } catch (error) {
          console.error('交付集市任务失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },
      // 放弃集市任务
      async cancelTask(task_id) {
        try {
          this.loading = true
          const response = await farmApi.cancelTask({ id: task_id }) || []
          this.marketList = response || []
          return response
        } catch (error) {
          console.error('放弃集市任务失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },
      // 土地升级/开垦信息
      async getLandUpgradeInfo() {
        try {
          this.loading = true
          const response = await farmApi.getLandUpgradeInfo() || []
          this.landUpgradeInfo = response || []
          return response
        } catch (error) {
          console.error('获取土地升级/开垦信息失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },
      // 土地升级/开垦
      async upgradeLand(upgrade_type) {
        try {
          this.loading = true
          const response = await farmApi.upgradeLand({upgrade_type: upgrade_type}) || []
          this.lands = response || []
          return response
        } catch (error) {
          console.error('土地升级/开垦失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },
      // 特殊建筑基础信息
      async getSpecialInfo() {
        try {
          this.loading = true
          const response = await farmApi.getSpecialInfo() || []
          this.specialInfo = response || []
          return response
        } catch (error) {
          console.error('获取特殊建筑基础信息失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },
      // 点击世界树
      async clickWorldTree() {
        try {
          this.loading = true
          await farmApi.clickWorldTree()
        } catch (error) {
          console.error('点击世界树失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },
      // 配送工具列表
      async getDeliveryToolList() {
        try {
          this.loading = true
          const response = await farmApi.getDeliveryToolList() || []
          this.deliveryToolList = response || []

          // 记录它是否有几个工具里面有一个值is_have为1
          this.isHaveDeliveryTool = response.some(item => item.is_have === 1)

          return response
        } catch (error) {
          console.error('获取配送工具列表失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },
      // 购买配送工具
      async buyDeliveryTool(id) {
        try {
          this.loading = true
          return await farmApi.buyDeliveryTool({ id: id }) || []
        } catch (error) {
          console.error('购买配送工具失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },
      // 使用配送工具
      async useDeliveryTool(tool_id, handbook_id) {
        try {
          this.loading = true
          const response = await farmApi.useDeliveryTool({ tool_id: tool_id, handbook_id: handbook_id }) || []
          this.deliveryToolList = response || []
          return response
        } catch (error) {
          console.error('使用配送工具失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },
      // 配送结束后更新用户资产和配送记录
      async updateDeliveryRecord(id) {
        try {
          this.loading = true
          const response = await farmApi.updateDeliveryRecord({ id: id }) || []
          this.deliveryToolList = response || []
          return response
        } catch (error) {
          console.error('配送结束后更新用户资产和配送记录失败', error)
          throw error
        } finally {
          this.loading = false
        }
      },
    }
  })
