import request from '../utils/request'

export const farmApi = {
  initFarm() {
    return request({
      url: '/api/farmUser/initFarm',
      method: 'post',
      silent: true,
    })
  },
  getLandList() {
    return request({
      url: '/api/farmUser/getLandList',
      method: 'post',
      silent: true,
    })
  },
  plant(data) {
    return request({
      url: '/api/farmUser/plant', // 种植
      method: 'post',
      data,
      silent: true,
    })
  },
  // 一键种植
  plantAll(data) {
    return request({
      url: '/api/farmUser/plantAll', //
      method: 'post',
      data,
      silent: true,
    })
  },
  remove(data) {
    return request({
      url: '/api/farmUser/remove', // 铲除
      method: 'post',
      data,
      silent: true,
    })
  },
  removeAll() {
    return request({
      url: '/api/farmUser/removeAll', // 一键铲除所有
      method: 'post',
      silent: true,
    })
  },
  refresh(data) {
    return request({
      url: '/api/farmUser/refresh', // 刷新
      method: 'post',
      data,
      silent: true,
    })
  },
  harvest(data) {
    return request({
      url: '/api/farmUser/harvest', // 收获
      method: 'post',
      data,
      silent: true,
    })
  },
  harvestAll() {
     return request({
      url: '/api/farmUser/harvestAll', // 收获全部
      method: 'post',
      silent: true,
    })
  },
  // 一键收获
  getShopList(data) {
    return request({
      url: '/api/farmShop/getList', // 商店列表
      method: 'get',
      data,
      silent: true,
    })
  },
  getShopList(data) {
    return request({
      url: '/api/farmShop/getList', // 商店列表
      method: 'get',
      data,
      silent: true,
    })
  },
  shopBuy(data) {
    return request({
      url: '/api/farmShop/buy', // 购买
      method: 'post',
      data,
      silent: true,
    })
  },

  getWarehouseList(data) {
    return request({
      url: '/api/farmWarehouse/getList', // 仓库列表
      method: 'post',
      data,
      silent: true,
    })
  },
  // 扩充仓库
  extendWarehouse() {
    return request({
      url: '/api/farmWarehouse/extend', // 扩充仓库
      method: 'post',
      silent: true,
    })
  },
  // warehouseSell(data) {
  //   return request({
  //     url: '/api/farmWarehouse/sell', // 卖出
  //     method: 'post',
  //     data,
  //   })
  // },
  // warehouseSellAll() {
  //   return request({
  //     url: '/api/farmWarehouse/sellAll', // 卖出全部
  //     method: 'post',
  //   })
  // },
  getMarketList(data) {
    return request({
      url: '/api/farmTask/getList', // 集市列表
      method: 'post',
      data,
      silent: true,
    })
  },
  // 交付集市任务
  deliverTask(data) {
    return request({
      url: '/api/farmTask/submit', // 交付
      method: 'post',
      data,
      silent: true,
    })
  },
  // 放弃集市任务
  cancelTask(data) {
    return request({
      url: '/api/farmTask/cancel', // 放弃
      method: 'post',
      data,
      silent: true,
    })
  },

  // 土地升级/开垦信息
  getLandUpgradeInfo() {
    return request({
      url: '/api/farmUser/getLandUpgradeInfo', // 土地升级/开垦信息
      method: 'post',
      silent: true,
    })
  },
  // 土地升级/开垦
  upgradeLand(data) {
    return request({
      url: '/api/farmUser/upgradeLand', // 土地升级/开垦
      method: 'post',
      data,
      silent: true,
    })
  },

  // 特殊建筑基础信息
  getSpecialInfo() {
    return request({
      url: '/api/farmUser/getSpecialInfo', // 特殊建筑基础信息
      method: 'post',
      silent: true,
    })
  },
  // 点击世界树
  clickWorldTree() {
    return request({
      url: '/api/farmUser/clickWorldTree', // 点击世界树
      method: 'post',
      silent: true,
    })
  },
  // 配送工具列表
  getDeliveryToolList() {
    return request({
      url: '/api/farmUser/getDeliveryToolInfo', // 配送工具列表
      method: 'post',
      silent: true,
    })
  },
  // 购买配送工具
  buyDeliveryTool(data) {
    return request({
      url: '/api/farmUser/buyDeliveryTool', // 购买配送工具
      method: 'post',
      data,
      silent: true,
    })
  },
  // 使用配送工具
  useDeliveryTool(data) {
    return request({
      url: '/api/farmUser/useDeliveryTool', // 使用配送工具
      method: 'post',
      data,
      silent: true,
    })
  },
  // 配送结束后更新用户资产和配送记录
  updateDeliveryRecord(data) {
    return request({
      url: '/api/farmUser/updateDeliveryRecord', // 配送结束后更新用户资产和配送记录
      method: 'post',
      data,
      silent: true,
    })
  },
}
