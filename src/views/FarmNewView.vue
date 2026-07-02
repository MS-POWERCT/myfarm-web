<template>
  <div class="farm-new">
    <!-- 顶部导航栏 -->
    <div class="top-header">
      <div class="header-left" @click="logout">
        <IconifyIcon icon="basil:logout-solid" width="20" />
      </div>
      <div class="header-title">
        <span class="title-text">{{ userName }}</span>
        <span class="title-sub">{{ globalStore.FARM_NAME }}</span>
      </div>
      <div class="header-right" @click="$router.push('/userSettings/statistics')">
        <IconifyIcon icon="mdi:account-settings" width="20" />
      </div>
    </div>

    <!-- 状态栏卡片 -->
    <div class="status-card">
      <div class="status-top">
        <div class="level-info">
          <div class="level-badge">
            <span class="level-num">Lv.{{ levelId }}</span>
          </div>
          <div class="level-detail">
            <div class="level-title">{{ levelTitle }}</div>
            <div class="exp-text">{{ exp }} / {{ nextLevelExp }}</div>
          </div>
        </div>
        <div class="wallet-info">
          <div v-for="walletAsset in walletAssets" :key="walletAsset.asset_id" class="wallet-item">
            <IconifyIcon v-if="walletAsset.asset_id === 1" icon="game-icons:gold-coin" width="18" class="coin-icon" />
            <IconifyIcon v-else icon="ph:gem" width="18" class="gem-icon" />
            <span class="wallet-num">{{ walletAsset.balance }}</span>
          </div>
        </div>
      </div>
      <div class="exp-bar-container">
        <div class="exp-bar-bg">
          <div class="exp-bar-fill" :style="{ width: expProgress + '%' }">
            <div class="exp-bar-glow"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 公告栏 -->
    <div v-if="notice" class="notice-bar">
      <IconifyIcon icon="solar:megaphone-bold-duotone" width="16" class="notice-icon" />
      <span class="notice-text">{{ notice }}</span>
    </div>

    <!-- 配送状态浮动面板 -->
    <div v-if="hasDeliveryingTools.length > 0" class="delivery-panel">
      <div v-for="tool in hasDeliveryingTools" :key="tool.id" class="delivery-card">
        <div class="delivery-icon">
          <IconifyIcon :icon="tool.icon" width="22" />
        </div>
        <div class="delivery-content">
          <div class="delivery-top">
            <span class="delivery-name">{{ tool.name }}</span>
            <span class="delivery-count">{{ tool.delivery_record.num }}件</span>
          </div>
          <div class="delivery-mid">
            <span class="delivery-item">{{ tool.delivery_record.handbook?.name }}</span>
            <span class="delivery-reward">+{{ tool.delivery_record.amount }}{{
              tool.delivery_record.handbook?.selling_asset_name || '灵石' }}</span>
          </div>
          <div class="delivery-bottom">
            <van-count-down v-if="tool.delivery_record.status === 0"
              :time="getDeliveryTime(tool.delivery_record.end_at)" format="mm:ss" class="delivery-time"
              @finish="onDeliveryFinish(tool)" />
            <span v-else class="delivery-done">已完成</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 土地区域 -->
    <div class="land-section">
      <div class="section-header">
        <div class="section-title">
          <IconifyIcon icon="mdi:grass" width="20" class="title-icon" />
          <span>我的土地</span>
        </div>
        <div class="section-actions">
          <span class="action-btn" @click="init()">
            <IconifyIcon icon="mdi:refresh" width="14" />
            刷新
          </span>
          <span class="action-btn" @click="clearAll()">
            <IconifyIcon icon="mdi:shovel" width="14" />
            铲除
          </span>
          <span class="action-btn" @click="harvestAll()">
            <IconifyIcon icon="mdi:scissors" width="14" />
            收获
          </span>
          <span v-if="isChoiceMode" class="action-btn primary" @click="doPlantAll()">
            <IconifyIcon icon="mdi:sprout" width="14" />
            播种
          </span>
        </div>
      </div>

      <div class="land-grid">
        <div v-for="(land, index) in lands" :key="index"
          :class="['land-card', `land-status-${land.status}`, `land-level-${land.level_id}`]"
          @click="handleLandClick(land, index)">
          <div class="land-num">{{ index + 1 }}</div>
          <div class="land-icon">
            <IconFont v-if="land.status === 1 || land.status === 2" :name="land.handbook.icon" />
            <IconifyIcon v-else-if="land.status === 0" icon="mdi:soil" width="28" />
            <IconifyIcon v-else-if="land.status === 3" icon="mdi:sprout-off" width="28" />
            <IconifyIcon v-else-if="land.status === 9" icon="mdi:lock-outline" width="28" />
          </div>
          <div class="land-info">
            <div class="land-name">{{ landName(land, index) }}</div>
            <div class="land-status-text">{{ landStatus(land.status) }}</div>
            <van-count-down v-if="land.status === 1" :time="getTime(land.plant_mature_at)" format="HH:mm:ss"
              class="countdown" @finish="onFinish(land.id)" />
          </div>
          <div class="land-badge" v-if="land.status === 2">
            <IconifyIcon icon="mdi:check-circle" width="16" />
          </div>
        </div>
      </div>
    </div>

    <!-- 功能区域 -->
    <div class="function-section">
      <div class="function-tabs">
        <div v-for="tab in tabs" :key="tab.key" :class="['function-tab', { active: currentFunction === tab.key }]"
          @click="switchTab(tab.key)">
          <IconifyIcon :icon="tab.icon" width="18" />
          <span>{{ tab.name }}</span>
        </div>
      </div>

      <div class="function-content">
        <!-- 背包种子 -->
        <div v-if="currentFunction === 'backpack'" class="content-panel">
          <div class="panel-header">
            <span v-if="isChoiceMode" class="selected-tip">
              已选择 <b>{{ selectedHandbookName }}</b>
              <span class="cancel-btn" @click="cancelChoice">取消</span>
            </span>
            <span v-else class="panel-tip">选择种子进行种植</span>
          </div>
          <div v-if="seedList.length > 0" class="item-grid">
            <div v-for="seed in seedList" :key="seed.name"
              :class="['item-card', { active: selectedHandbookId === seed.handbook_id }]"
              @click="doChoice(seed.handbook_id, seed.handbook.name)">
              <div class="item-icon">
                <IconFont :name="seed.handbook.icon" />
              </div>
              <div class="item-name">{{ seed.handbook.name }}</div>
              <div class="item-count">x{{ seed.num }}</div>
              <div class="item-meta">{{ seed.handbook.quarter }}季</div>
            </div>
          </div>
          <div v-else class="empty-state">
            <IconifyIcon icon="mdi:package-variant-closed" width="48" class="empty-icon" />
            <span>背包空空如也</span>
          </div>
        </div>

        <!-- 种子商店 -->
        <div v-if="currentFunction === 'shop'" class="content-panel">
          <div class="panel-header">
            <span class="panel-tip">购买数量：</span>
            <div class="stepper">
              <span class="stepper-btn" @click="decreaseBuyQty">-</span>
              <input type="number" v-model.number="globalBuyQuantity" min="1" class="stepper-input" />
              <span class="stepper-btn" @click="increaseBuyQty">+</span>
            </div>
          </div>
          <div v-if="shops.length > 0" class="item-list">
            <div v-for="item in shops" :key="item.id" class="shop-item">
              <div class="shop-icon">
                <IconFont :name="item.handbook.icon" />
              </div>
              <div class="shop-info">
                <div class="shop-name">{{ item.handbook.name }}</div>
                <div class="shop-meta">
                  <span>{{ item.handbook.quarter }}季</span>
                  <span class="shop-price">
                    <IconifyIcon icon="game-icons:gold-coin" width="14" />
                    {{ item.handbook.price }}
                  </span>
                </div>
              </div>
              <button class="buy-btn" @click="buy(item)">购买</button>
            </div>
          </div>
          <div v-else class="empty-state">
            <IconifyIcon icon="mdi:store-off" width="48" class="empty-icon" />
            <span>暂无商品</span>
          </div>
        </div>

        <!-- 仓库 -->
        <div v-if="currentFunction === 'fruit'" class="content-panel">
          <div class="panel-header">
            <span class="panel-tip">仓库 {{ warehouseUse }} / {{ warehouseSize }}</span>
            <span v-if="nextExtendPrice > 0" class="extend-btn" @click="extendWarehouse">
              扩充 +{{ nextExtendSize }} ({{ nextExtendPrice }}灵石)
            </span>
            <span v-else class="text-gray">仓库已满</span>
          </div>
          <div v-if="fruitList.length > 0" class="item-grid">
            <div v-for="fruit in fruitList" :key="fruit.name" class="item-card" v-t="fruit">
              <div class="item-icon">
                <IconFont :name="fruit.handbook.icon" />
              </div>
              <div class="item-name">{{ fruit.handbook.name }}</div>
              <div class="item-count">x{{ fruit.num }}</div>
              <div class="item-meta">
                <span class="text-gray">售价: {{ fruit.handbook.selling_price }}{{ fruit.handbook.selling_asset_name
                }}</span>
              </div>
              <div v-if="isHaveDeliveryTool" class="delivery-btn" @click.stop="clickDelivery(fruit)">
                <IconifyIcon icon="mdi:truck-fast-outline" width="14" />
                送货
              </div>
              <div v-if="showDeliveryPopup && selectedFruit?.handbook_id === fruit.handbook_id" class="delivery-float">
                <div v-for="tool in availableDeliveryTools" :key="tool.id" class="float-item"
                  @click.stop="selectDeliveryTool(tool)">
                  <IconifyIcon :icon="tool.icon" width="18" />
                  <span>{{ tool.name }}</span>
                </div>
                <div v-if="availableDeliveryTools.length === 0" class="float-item disabled">
                  <span>无配送工具</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <IconifyIcon icon="mdi:warehouse" width="48" class="empty-icon" />
            <span>仓库空空如也</span>
          </div>
        </div>

        <!-- 土地升级 -->
        <div v-if="currentFunction === 'upgrade'" class="content-panel">
          <div class="panel-header">
            <span class="panel-tip">升级土地提高产量</span>
          </div>
          <div v-if="landUpgradeInfo.length > 0" class="upgrade-list">
            <div v-for="upgrade in landUpgradeInfo" :key="upgrade.id" class="upgrade-card">
              <div class="upgrade-icon">
                <IconifyIcon
                  :icon="upgrade.upgrade_type === 'add' ? 'mdi:plus-box-multiple-outline' : 'mdi:arrow-up-bold-circle-outline'"
                  width="28" />
              </div>
              <div class="upgrade-info">
                <div class="upgrade-name">{{ upgrade.name }}</div>
                <div class="upgrade-desc">{{ upgrade.desc }}</div>
              </div>
              <div class="upgrade-action">
                <div class="upgrade-cost">
                  <IconifyIcon icon="game-icons:gold-coin" width="14" />
                  {{ upgrade.price }}
                </div>
                <button class="upgrade-btn" @click="upgradeLand(upgrade)">{{ upgrade.bottom }}</button>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <IconifyIcon icon="mdi:trending-up" width="48" class="empty-icon" />
            <span>暂无升级信息</span>
          </div>
        </div>

        <!-- 集市 -->
        <div v-if="currentFunction === 'market'" class="content-panel">
          <div class="panel-header">
            <span class="panel-tip">刷新倒计时：
              <van-count-down :time="marketRefreshTime" format="HH:mm:ss" class="countdown-inline"
                @finish="onMarketRefreshFinish" />
            </span>
          </div>
          <div v-if="marketList.length > 0" class="market-list">
            <div v-for="item in marketList" :key="item.id" class="market-card">
              <div class="market-header">
                <div class="market-npc">
                  <IconifyIcon icon="mdi:account-circle-outline" width="18" />
                  {{ item.farm_task.npc_name }}
                </div>
                <span :class="['quality-badge', `quality-${item.farm_task.quality_type}`]">
                  {{ item.farm_task.quality_type_name }}
                </span>
              </div>
              <div class="market-name">{{ item.farm_task.name }}</div>
              <div class="market-desc">{{ item.farm_task.description }}</div>
              <div class="market-need">
                <span class="label">需求：</span>
                <span v-for="(status, idx) in getRequirementStatus(item)" :key="idx"
                  :class="status.isMet ? 'need-met' : 'need-unmet'">
                  {{ handbooks[status.handbook_id] ?? '-' }}
                  <span class="text-gray">({{ status.current }}/{{ status.required }})</span>
                </span>
              </div>
              <div class="market-reward">
                <span class="label">奖励：</span>
                <span class="reward-item">
                  <IconifyIcon icon="mdi:star-four-points-outline" width="12" />
                  经验+{{ item.farm_task.reward_exp }}
                </span>
                <span class="reward-item">
                  <IconifyIcon icon="game-icons:gold-coin" width="12" />
                  {{ item.farm_task.reward_asset.name }}+{{ item.farm_task.reward_gold }}
                </span>
              </div>
              <div class="market-actions">
                <span class="market-btn cancel" @click="cancelTask(item)">放弃</span>
                <span v-if="checkTaskRequirements(item)" class="market-btn deliver" @click="deliverTask(item)">交付</span>
                <span v-else class="market-btn disabled">货物不足</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <IconifyIcon icon="mdi:storefront-outline" width="48" class="empty-icon" />
            <span>暂无集市订单</span>
          </div>
        </div>

        <!-- 特殊建筑 -->
        <div v-if="currentFunction === 'building'" class="content-panel">
          <div class="building-card">
            <div class="building-header">
              <div class="building-icon">
                <IconifyIcon icon="streamline-emojis:christmas-tree" width="48" />
              </div>
              <div class="building-info">
                <div class="building-name">世界树</div>
                <div class="building-desc">每日点击获得祝福</div>
              </div>
              <button v-if="worldTree.is_click === 0" class="bless-btn" @click="clickWorldTree">获得祝福</button>
              <span v-else class="blessed">已祝福</span>
            </div>
            <div class="building-stats">
              <div class="stat-item">
                <div class="stat-label">每次奖励</div>
                <div class="stat-value">
                  <span>
                    <IconifyIcon icon="mdi:star-four-points-outline" width="14" /> +{{ worldTree.exp }}
                  </span>
                  <span>
                    <IconifyIcon icon="game-icons:gold-coin" width="14" /> +{{ worldTree.gold }}
                  </span>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-label">累计奖励</div>
                <div class="stat-value">
                  <span>
                    <IconifyIcon icon="mdi:star-four-points-outline" width="14" /> +{{ worldTree.total_exp }}
                  </span>
                  <span>
                    <IconifyIcon icon="game-icons:gold-coin" width="14" /> +{{ worldTree.total_gold }}
                  </span>
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-label">祝福次数</div>
                <div class="stat-value">{{ worldTree.click_count }} 次</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 配送工具 -->
        <div v-if="currentFunction === 'delivery'" class="content-panel">
          <div class="panel-header">
            <span class="panel-tip">购买配送工具自动收益</span>
          </div>
          <div v-if="deliveryTools.length > 0" class="delivery-tool-list">
            <div v-for="tool in deliveryTools" :key="tool.id"
              :class="['tool-card', { owned: tool.is_have === 1, delivering: tool.is_delivery === 1 }]">
              <div class="tool-icon">
                <IconifyIcon :icon="tool.icon" width="36" />
              </div>
              <div class="tool-info">
                <div class="tool-name">
                  {{ tool.name }}
                  <span v-if="tool.is_have === 1" class="owned-tag">已拥有</span>
                </div>
                <div class="tool-stats">
                  <span>容量 {{ tool.capacity }}</span>
                  <span>{{ tool.delivery_time }}分钟</span>
                </div>
              </div>
              <div v-if="tool.is_have === 0" class="tool-buy">
                <div class="tool-price">
                  <IconifyIcon icon="game-icons:gold-coin" width="14" />
                  {{ tool.price }}
                </div>
                <div class="tool-level">Lv.{{ tool.level_id }} 解锁</div>
                <button class="buy-tool-btn" @click="buyDeliveryTool(tool)">购买</button>
              </div>
              <div v-else-if="tool.is_delivery === 1" class="tool-delivering">
                <IconifyIcon icon="mdi:truck-fast" width="20" class="delivering-icon" />
                <span>配送中</span>
              </div>
              <div v-else class="tool-idle">
                <IconifyIcon icon="mdi:check-circle" width="20" />
                <span>空闲</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <IconifyIcon icon="mdi:truck-outline" width="48" class="empty-icon" />
            <span>暂无配送工具</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部版权 -->
    <div class="footer">
      <IconifyIcon icon="mdi:sprout" width="16" />
      <span>纯文字农场</span>
      <span class="footer-sep">｜</span>
      <span>2026 Self Youth</span>
      <IconifyIcon icon="mdi:sprout" width="16" />
    </div>

    <!-- 消息提示 -->
    <div class="toast-container">
      <transition-group name="toast">
        <div v-for="msg in messages" :key="msg.id"
          :class="['toast-item', `toast-${msg.type}`, { 'toast-leaving': !msg.visible }]">
          <IconifyIcon v-if="msg.type === 'success'" icon="mdi:check-circle" width="16" />
          <IconifyIcon v-else-if="msg.type === 'error'" icon="mdi:alert-circle" width="16" />
          <IconifyIcon v-else-if="msg.type === 'warning'" icon="mdi:alert" width="16" />
          <IconifyIcon v-else icon="mdi:information" width="16" />
          <span>{{ msg.text }}</span>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import router from '@/router'
import { useGlobalStore } from '../stores/global'
import { useFarmStore } from '../stores/farm'
import { useUserStore } from '../stores/user'
import IconFont from '@/components/IconFont.vue'

const globalStore = useGlobalStore()
const farmStore = useFarmStore()
const userStore = useUserStore()

const notice = ref('【公告】欢迎来到纯文字农场，每日签到世界树可获得经验和灵石，集市任务奖励丰厚哦')

const tabs = [
  { key: 'backpack', name: '背包', icon: 'mdi:bag-personal-outline' },
  { key: 'shop', name: '商店', icon: 'mdi:store-outline' },
  { key: 'fruit', name: '仓库', icon: 'mdi:warehouse' },
  { key: 'upgrade', name: '升级', icon: 'mdi:trending-up' },
  { key: 'market', name: '集市', icon: 'mdi:storefront-outline' },
  { key: 'building', name: '建筑', icon: 'mdi:castle-outline' },
  { key: 'delivery', name: '配送', icon: 'mdi:truck-outline' },
]

const STORAGE_KEY = 'farm_new_active_tab'
const currentFunction = ref('backpack')

const switchTab = (tab) => {
  currentFunction.value = tab
}

const loadSavedTab = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && tabs.map(t => t.key).includes(saved)) {
    currentFunction.value = saved
  }
}

const saveCurrentTab = () => {
  localStorage.setItem(STORAGE_KEY, currentFunction.value)
}

watch(currentFunction, () => {
  saveCurrentTab()
})

const messages = ref([])
let messageId = 0

const globalBuyQuantity = ref(1)

const decreaseBuyQty = () => {
  if (globalBuyQuantity.value > 1) {
    globalBuyQuantity.value--
  }
}

const increaseBuyQty = () => {
  if (globalBuyQuantity.value < 100) {
    globalBuyQuantity.value++
  }
}

const showDeliveryPopup = ref(false)
const selectedFruit = ref(null)

const clickDelivery = (fruit) => {
  if (showDeliveryPopup.value && selectedFruit.value?.handbook_id === fruit.handbook_id) {
    showDeliveryPopup.value = false
    selectedFruit.value = null
  } else {
    selectedFruit.value = fruit
    showDeliveryPopup.value = true
  }
}

const availableDeliveryTools = computed(() => {
  return deliveryTools.value.filter(tool => tool.is_have === 1 && tool.is_delivery !== 1)
})

const selectDeliveryTool = async (tool) => {
  if (!selectedFruit.value) return

  try {
    await farmStore.useDeliveryTool(tool.id, selectedFruit.value.handbook_id)
    showToast({ message: `开始配送${selectedFruit.value.handbook.name}！`, type: 'success' })
    showDeliveryPopup.value = false
    selectedFruit.value = null
    await farmStore.getDeliveryToolList()
    await farmStore.fetchWarehouseList('fruit')
  } catch (error) {
    showToast({ message: error || '配送失败', type: 'error' })
  }
}

const selectedLandId = ref(null)
const isChoiceMode = ref(false)
const selectedHandbookId = ref(null)
const selectedHandbookName = ref(null)

const getMarketRefreshTime = () => {
  const now = new Date()
  const refreshHours = [12, 24]
  let minDiff = Infinity

  for (const hour of refreshHours) {
    const target = new Date()
    if (hour === 24) {
      target.setDate(target.getDate() + 1)
      target.setHours(0, 0, 0, 0)
    } else {
      target.setHours(hour, 0, 0, 0)
    }
    const diff = target.getTime() - now.getTime()
    if (diff > 0 && diff < minDiff) {
      minDiff = diff
    }
  }

  return minDiff > 0 ? minDiff : 0
}

const marketRefreshTime = ref(getMarketRefreshTime())

const onMarketRefreshFinish = async () => {
  await farmStore.fetchMarketList()
  marketRefreshTime.value = getMarketRefreshTime()
}

const getTime = (time) => {
  const now = new Date()
  const targetTime = new Date(time)
  return Math.floor(targetTime.getTime() - now.getTime())
}

const getDeliveryTime = (time) => {
  const now = new Date()
  const targetTime = new Date(time)
  const diff = Math.floor(targetTime.getTime() - now.getTime())
  return diff > 0 ? diff : 0
}

const completedDeliveries = new Set()

const settleDelivery = async (tool) => {
  const recordId = tool.delivery_record?.id

  if (completedDeliveries.has(recordId)) {
    return
  }
  completedDeliveries.add(recordId)

  updateAsset(tool.delivery_record.handbook?.selling_asset_id, tool.delivery_record.amount, 'add')
  await farmStore.updateDeliveryRecord(tool.delivery_record.id)
  showToast({ message: `配送${tool.delivery_record.handbook?.name}*${tool.delivery_record.num}完成！`, type: 'success' })
}

const onDeliveryFinish = async (tool) => {
  await settleDelivery(tool)
}

let deliveryCheckTimer = null

const checkTimeoutDeliveries = () => {
  deliveryTools.value.forEach(tool => {
    if (tool.is_delivery === 1 && tool.delivery_record) {
      const remainingTime = getTime(tool.delivery_record.end_at)
      if (remainingTime <= 0 && tool.delivery_record.status === 0) {
        settleDelivery(tool)
      }
    }
  })
}

const startDeliveryCheck = () => {
  if (deliveryCheckTimer) return
  deliveryCheckTimer = setInterval(() => {
    checkTimeoutDeliveries()
  }, 1000)
}

const stopDeliveryCheck = () => {
  if (deliveryCheckTimer) {
    clearInterval(deliveryCheckTimer)
    deliveryCheckTimer = null
  }
}

const showToast = (msg) => {
  const id = ++messageId
  const message = typeof msg === 'string' ? msg : msg.message || '操作完成'
  const type = typeof msg === 'object' && msg.type ? msg.type : 'info'

  messages.value.push({
    id,
    text: message,
    type,
    visible: true
  })

  setTimeout(() => {
    const index = messages.value.findIndex(m => m.id === id)
    if (index > -1) {
      messages.value[index].visible = false
      setTimeout(() => {
        const idx = messages.value.findIndex(m => m.id === id)
        if (idx > -1) {
          messages.value.splice(idx, 1)
        }
      }, 300)
    }
  }, 2500)
}

const addExp = async (expValue, actionName = '') => {
  if (expValue <= 0) return
  showToast({ message: `${actionName}经验+${expValue}`, type: 'success' })
  userInfo.value.exp += expValue

  if (userInfo.value.exp >= nextLevelExp.value) {
    showToast({ message: '恭喜你升级了！', type: 'success' })
    await farmStore.fetchFarmInfo()
  }
}

const updateAsset = async (assetId, amount, action = 'add') => {
  const asset = walletAssets.value.find(a => a.asset_id === assetId)

  if (!asset) {
    console.error(`未找到资产 ID: ${assetId}`)
    return false
  }

  const currentBalance = Number(asset.balance)
  const changeAmount = Number(amount)

  if (action === 'deduct') {
    if (currentBalance < changeAmount) {
      showToast({ message: `${asset.asset.name}不足`, type: 'warning' })
      return false
    }
    asset.balance = currentBalance - changeAmount
    showToast({ message: `${asset.asset.name}-${changeAmount}`, type: 'info' })
  } else {
    asset.balance = currentBalance + changeAmount
    showToast({ message: `${asset.asset.name}+${changeAmount}`, type: 'success' })
  }

  return true
}

const expProgress = computed(() => (exp.value / nextLevelExp.value * 100) || 0)
const userInfo = computed(() => farmStore.info || {})
const userName = computed(() => userInfo.value.user_name || '')
const levelId = computed(() => userInfo.value.level_id || 1)
const levelTitle = computed(() => userInfo.value.level_title || '')
const exp = computed(() => userInfo.value.exp || 0)
const handbooks = computed(() => userInfo.value.handbooks || [])
const nextLevelExp = computed(() => userInfo.value.next_level_exp || 100)
const walletAssets = computed(() => userInfo.value.wallet_assets || [])
const warehouseSize = computed(() => userInfo.value.warehouse_size || 0)
const warehouseUse = computed(() => userInfo.value.warehouse_use || 0)
const nextExtendPrice = computed(() => userInfo.value.next_extend_price || 0)
const nextExtendSize = computed(() => userInfo.value.next_extend_size || 0)
const lands = computed(() => farmStore.lands || [])
const shops = computed(() => farmStore.shops || [])
const seedList = computed(() => farmStore.seedList || [])
const fruitList = computed(() => farmStore.fruitList || [])
const marketList = computed(() => farmStore.marketList || [])
const landUpgradeInfo = computed(() => farmStore.landUpgradeInfo || [])
const specialInfo = computed(() => farmStore.specialInfo || {})
const worldTree = computed(() => specialInfo.value.world_tree || {})
const deliveryTools = computed(() => farmStore.deliveryToolList || [])
const isHaveDeliveryTool = computed(() => farmStore.isHaveDeliveryTool || false)
const hasDeliveryingTools = computed(() => {
  return deliveryTools.value.filter(tool => tool.is_delivery === 1 && tool.delivery_record)
})

const clickWorldTree = async () => {
  try {
    await farmStore.clickWorldTree()
    await addExp(worldTree.value.exp, '世界树')
    await updateAsset(1, worldTree.value.gold, 'add')
    showToast({ message: '获得世界树的祝福！', type: 'success' })
    await farmStore.getSpecialInfo()
  } catch (error) {
    showToast({ message: error || '点击世界树失败', type: 'error' })
  }
}

const checkTaskRequirements = (task) => {
  if (!task.farm_task?.task_need || !fruitList.value || fruitList.value.length === 0) {
    return false
  }

  for (const need of task.farm_task.task_need) {
    const needId = Number(need.handbook_id)
    const fruit = fruitList.value.find(f =>
      Number(f.handbook_id) === needId ||
      Number(f.handbook?.id) === needId
    )
    if (!fruit || fruit.num < need.quantity) {
      return false
    }
  }
  return true
}

const getRequirementStatus = (task) => {
  if (!task.farm_task?.task_need || !fruitList.value || fruitList.value.length === 0) {
    return []
  }

  return task.farm_task.task_need.map(need => {
    const needId = Number(need.handbook_id)
    const fruit = fruitList.value.find(f =>
      Number(f.handbook_id) === needId ||
      Number(f.handbook?.id) === needId
    )
    const currentNum = fruit ? fruit.num : 0
    const requiredNum = need.quantity
    const isMet = currentNum >= requiredNum

    return {
      handbook_id: need.handbook_id,
      current: currentNum,
      required: requiredNum,
      isMet
    }
  })
}

const deliverTask = async (task) => {
  try {
    await farmStore.deliverTask(task.id)
    await addExp(task.farm_task.reward_exp, '任务')
    await updateAsset(task.farm_task.reward_asset_id, task.farm_task.reward_gold, 'add')
    await farmStore.fetchWarehouseList('fruit')
    showToast({ message: '任务完成！', type: 'success' })
  } catch (error) {
    showToast({ message: error || '交付失败', type: 'error' })
  }
}

const cancelTask = async (task) => {
  try {
    await farmStore.cancelTask(task.id)
    showToast({ message: '已放弃任务', type: 'info' })
  } catch (error) {
    showToast({ message: '操作失败' + error, type: 'error' })
  }
}

const landName = (land, index) => {
  switch (land.status) {
    case 0:
      return '土地' + (index + 1)
    case 1:
      return land.handbook.name + '【' + land.quarter + '/' + land.handbook.quarter + '季】'
    case 2:
      return land.handbook.name + '【产出' + land.residue_output + '/' + land.total_output + '】【' + land.quarter + '/' + land.handbook.quarter + '季】'
    case 3:
      return land.handbook.name + '-枯萎'
    case 9:
      return '土地' + (index + 1)
    default:
      return ''
  }
}

const landStatus = (status) => {
  switch (status) {
    case 0:
      return '空闲'
    case 1:
      return '生长中'
    case 2:
      return '成熟待收获'
    case 3:
      return '枯萎的作物'
    case 9:
      return '待开垦'
    default:
      return '未知状态'
  }
}

const onFinish = async (land_id) => {
  await farmStore.LandRefresh(land_id)
}

const handleLandClick = (land, index) => {
  selectedLandId.value = land.id
  if (land.status === 0) {
    sow(land.id, index)
  } else if (land.status === 2) {
    harvest(land)
  } else if (land.status === 1 || land.status === 3) {
    clearland(land.id)
  } else if (land.status === 9) {
    switchTab('upgrade')
  }
}

const sow = (id) => {
  switchTab('backpack')
  if (isChoiceMode.value) {
    selectedLandId.value = id
    doPlant(selectedHandbookId.value)
    return
  }
}

const doPlantAll = async () => {
  if (!isChoiceMode.value) return

  const seed = seedList.value.find(s => s.handbook_id === selectedHandbookId.value)
  if (!seed) {
    showToast({ message: '该种子已用完', type: 'error' })
    return
  }

  const emptyLands = lands.value.filter(l => l.status === 0)
  const seedCount = seed.num
  const plantCount = Math.min(seedCount, emptyLands.length)

  if (plantCount === 0) {
    showToast({ message: '没有可种植的土地', type: 'warning' })
    return
  }

  await farmStore.plantAll({ handbook_id: selectedHandbookId.value })

  showToast({ message: `成功种植${plantCount}块地！`, type: 'success' })

  const index = seedList.value.findIndex(seed => seed.handbook_id === selectedHandbookId.value);
  if (index !== -1) {
    const seed = seedList.value[index];
    seed.num -= plantCount;
    if (seed.num <= 0) {
      seedList.value.splice(index, 1);
    }
  }
  cancelChoice()
  await addExp(userInfo.value.default_exp.plant * plantCount, '种植')
}

const doPlant = async (handbook_id) => {
  if (!selectedLandId.value) {
    showToast({ message: '请先选择土地', type: 'warning' })
    return
  }

  const land = lands.value.find(l => l.id === selectedLandId.value)
  if (!land) {
    showToast({ message: '土地不存在', type: 'error' })
    return
  }

  if (land.status !== 0) {
    showToast({ message: '该土地不是空闲状态', type: 'warning' })
    return
  }

  await farmStore.plant({ handbook_id: handbook_id, land_id: selectedLandId.value })

  const index = seedList.value.findIndex(seed => seed.handbook_id === handbook_id);
  if (index !== -1) {
    const seed = seedList.value[index];
    seed.num--;
    if (seed.num <= 0) {
      seedList.value.splice(index, 1);
      cancelChoice()
    }
  }

  await addExp(userInfo.value.default_exp.plant, '种植')
}

const doChoice = async (handbook_id, handbook_name) => {
  selectedHandbookId.value = handbook_id
  selectedHandbookName.value = handbook_name
  isChoiceMode.value = true
}

const cancelChoice = () => {
  isChoiceMode.value = false
  selectedHandbookId.value = null
  selectedHandbookName.value = null
}

const clearland = async (id) => {
  const land = lands.value.find(l => l.id === id)
  if (land.status == 2) {
    return
  }
  farmStore.landRemove({ land_id: id })
  await addExp(userInfo.value.default_exp.shovel, '铲除土地')
}

const clearAll = async () => {
  const growingLands = lands.value.filter(l => l.status === 3)
  if (growingLands.length === 0) {
    showToast({ message: '没有可铲除的土地', type: 'warning' })
    showToast({ message: '一键铲除无法铲除生长中的的作物', type: 'warning' })
    return
  }

  await farmStore.LandRemoveAll()
  await addExp(userInfo.value.default_exp.shovel * growingLands.length, '铲除土地')
  showToast({ message: `成功铲除${growingLands.length}块地`, type: 'success' })
}

const harvest = async (land) => {
  try {
    await farmStore.LandHarvest(land.id)
    await farmStore.fetchWarehouseList('fruit')
    showToast({ message: `收获成功，获得${land.residue_output}个${land.handbook.name}`, type: 'success' })
    await addExp(land.handbook.quarter_exp, `收获${land.handbook.name}`)
  } catch (error) {
    showToast({ message: error || '收获失败', type: 'error' })
  }
}

const harvestAll = async () => {
  try {
    const growingLands = lands.value.filter(l => l.status === 2)
    if (growingLands.length === 0) {
      showToast({ message: '没有可收获的土地', type: 'warning' })
      return
    }

    await farmStore.LandHarvestAll()
    const totalExp = growingLands.reduce((acc, land) => acc + land.handbook.quarter_exp, 0)
    await addExp(totalExp, `收获${growingLands.length}块土地`)
    showToast({ message: `一键收获成功，获得${totalExp}点经验`, type: 'success' })
  } catch (error) {
    showToast({ message: error || '一键收获失败', type: 'error' })
  }
}

const buy = async (item) => {
  const num = globalBuyQuantity.value
  const spent = num * item.handbook.price
  try {
    const deducted = await updateAsset(item.handbook.asset_id, spent, 'deduct')
    if (!deducted) {
      return
    }

    const result = await farmStore.shopBuy(item, num)
    if (result.success) {
      await farmStore.fetchWarehouseList('seed')
      showToast({ message: `购买${num}个${item.handbook.name}成功`, type: 'success' })
    } else {
      await updateAsset(item.handbook.asset_id, spent, 'add')
    }
  } catch (error) {
    await updateAsset(item.handbook.asset_id, spent, 'add')
    showToast({ message: error || '购买失败', type: 'error' })
  }
}

const upgradeLand = async (upgrade) => {
  try {
    const deducted = await updateAsset(1, upgrade.price, 'deduct')
    if (!deducted) {
      return
    }

    await farmStore.upgradeLand(upgrade.upgrade_type)
    showToast({ message: `土地${upgrade.bottom}成功`, type: 'success' })
    await farmStore.getLandUpgradeInfo()
  } catch (error) {
    await updateAsset(1, upgrade.price, 'add')
    showToast({ message: error || '土地升级/开垦失败', type: 'error' })
  }
}

const extendWarehouse = async () => {
  try {
    const deducted = await updateAsset(1, nextExtendPrice.value, 'deduct')
    if (!deducted) {
      return
    }

    await farmStore.extendWarehouse()
    showToast({ message: `仓库扩充成功，新增${nextExtendSize.value}个位置`, type: 'success' })
    await farmStore.fetchFarmInfo()
    await farmStore.fetchWarehouseList('fruit')
  } catch (error) {
    await updateAsset(1, nextExtendPrice.value, 'add')
    showToast({ message: error || '仓库扩充失败', type: 'error' })
  }
}

const buyDeliveryTool = async (tool) => {
  if (levelId.value < tool.level_id) {
    showToast({ message: `需要达到 Lv.${tool.level_id} 才能购买`, type: 'error' })
    return
  }

  const deducted = await updateAsset(tool.asset_id, tool.price, 'deduct')
  if (!deducted) {
    return
  }

  try {
    await farmStore.buyDeliveryTool(tool.id)
    showToast({ message: `购买${tool.name}成功！`, type: 'success' })
    await farmStore.getDeliveryToolList()
  } catch (error) {
    await updateAsset(tool.asset_id, tool.price, 'add')
    showToast({ message: error || '购买配送工具失败', type: 'error' })
  }
}

const logout = async () => {
  await userStore.logout()
  router.push('/login')
}

const init = async () => {
  await farmStore.fetchFarmInfo()
  await farmStore.fetchLands()
  await farmStore.fetchShops()
  await farmStore.fetchWarehouseList('seed')
  await farmStore.fetchWarehouseList('fruit')
  await farmStore.fetchMarketList()
  await farmStore.getLandUpgradeInfo()
  await farmStore.getSpecialInfo()
  await farmStore.getDeliveryToolList()
  startDeliveryCheck()
}

onMounted(async () => {
  loadSavedTab()
  await init()
})

onUnmounted(() => {
  stopDeliveryCheck()
})
</script>

<style scoped>
.farm-new {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: #fff;
  padding-bottom: 20px;
  font-size: 13px;
}

.text-gray {
  color: rgba(255, 255, 255, 0.5);
}

.top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  padding-top: calc(16px + env(safe-area-inset-top));
}

.header-left,
.header-right {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  cursor: pointer;
}

.header-title {
  text-align: center;
}

.title-text {
  display: block;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #00d4ff, #7b2cbf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.title-sub {
  display: block;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

.status-card {
  margin: 8px 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 16px;
  backdrop-filter: blur(20px);
}

.status-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.level-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.level-badge {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.level-num {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
}

.level-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.level-title {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.exp-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.wallet-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wallet-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
}

.coin-icon {
  color: #ffd700;
}

.gem-icon {
  color: #00d4ff;
}

.wallet-num {
  min-width: 60px;
  text-align: right;
}

.exp-bar-container {
  width: 100%;
}

.exp-bar-bg {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.exp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #00d4ff 0%, #7b2cbf 100%);
  border-radius: 3px;
  position: relative;
  transition: width 0.5s ease;
}

.exp-bar-glow {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  background: radial-gradient(circle, rgba(0, 212, 255, 0.6) 0%, transparent 70%);
  filter: blur(4px);
}

.notice-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 16px;
  padding: 10px 14px;
  background: linear-gradient(90deg, rgba(255, 193, 7, 0.15) 0%, rgba(255, 193, 7, 0.05) 100%);
  border: 1px solid rgba(255, 193, 7, 0.2);
  border-radius: 12px;
  overflow: hidden;
}

.notice-icon {
  color: #ffc107;
  flex-shrink: 0;
}

.notice-text {
  font-size: 12px;
  color: #ffc107;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.delivery-panel {
  position: fixed;
  left: 12px;
  top: 200px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.delivery-card {
  display: flex;
  align-items: center;
  gap: 10px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%);
  border: 1px solid rgba(16, 185, 129, 0.3);
  border-radius: 12px;
  padding: 10px 12px;
  backdrop-filter: blur(10px);
  min-width: 130px;
}

.delivery-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #10b981;
}

.delivery-content {
  flex: 1;
}

.delivery-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
}

.delivery-count {
  color: rgba(255, 255, 255, 0.5);
  font-weight: normal;
  font-size: 11px;
}

.delivery-mid {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 2px;
}

.delivery-reward {
  color: #ffd700;
}

.delivery-bottom {
  margin-top: 4px;
}

.delivery-time {
  font-size: 11px;
  color: #10b981;
  font-weight: 600;
}

.delivery-done {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.land-section {
  margin: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
}

.title-icon {
  color: #4ade80;
}

.section-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  padding: 6px 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
}

.action-btn.primary {
  color: #4ade80;
  background: rgba(74, 222, 128, 0.2);
}

.land-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.land-card {
  position: relative;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.land-card:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
}

.land-card.land-level-2 {
  border-color: rgba(239, 68, 68, 0.4);
}

.land-card.land-level-3 {
  border-color: rgba(255, 215, 0, 0.4);
}

.land-num {
  position: absolute;
  top: 4px;
  left: 6px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
}

.land-icon {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}

.land-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.land-name {
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.land-status-text {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
}

.countdown {
  font-size: 10px;
  color: #4ade80;
  margin-top: 2px;
}

.land-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  color: #4ade80;
}

.function-section {
  margin: 0 16px;
}

.function-tabs {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 12px;
}

.function-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.function-tab.active {
  background: rgba(102, 126, 234, 0.3);
  border-color: rgba(102, 126, 234, 0.5);
  color: #fff;
}

.function-content {
  min-height: 200px;
}

.content-panel {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.1);
}

.panel-tip {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.selected-tip {
  font-size: 12px;
  color: #4ade80;
}

.cancel-btn {
  margin-left: 12px;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
}

.cancel-btn:hover {
  color: #fff;
}

.extend-btn {
  font-size: 12px;
  color: #4ade80;
  cursor: pointer;
}

.extend-btn:hover {
  text-decoration: underline;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stepper-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.stepper-input {
  width: 48px;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: #fff;
  text-align: center;
  font-size: 12px;
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.item-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 10px 6px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.item-card.active {
  background: rgba(74, 222, 128, 0.2);
  border-color: rgba(74, 222, 128, 0.4);
}

.item-icon {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 6px;
}

.item-name {
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-count {
  font-size: 10px;
  color: #ffd700;
  margin-top: 2px;
}

.item-meta {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 2px;
}

.delivery-btn {
  position: absolute;
  bottom: 4px;
  right: 4px;
  font-size: 10px;
  color: #06b6d4;
  cursor: pointer;
}

.delivery-float {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 100;
  min-width: 120px;
}

.float-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 11px;
}

.float-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.float-item.disabled {
  color: rgba(255, 255, 255, 0.4);
  cursor: not-allowed;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.4);
}

.empty-icon {
  margin-bottom: 10px;
  opacity: 0.5;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.shop-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 10px;
}

.shop-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.shop-info {
  flex: 1;
}

.shop-name {
  font-size: 13px;
  font-weight: 600;
}

.shop-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.shop-price {
  color: #ffd700;
}

.buy-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.buy-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.upgrade-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upgrade-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 12px;
}

.upgrade-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(74, 222, 128, 0.2);
  border-radius: 10px;
  color: #4ade80;
}

.upgrade-info {
  flex: 1;
}

.upgrade-name {
  font-size: 13px;
  font-weight: 600;
}

.upgrade-desc {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

.upgrade-action {
  text-align: right;
}

.upgrade-cost {
  font-size: 12px;
  color: #ffd700;
  margin-bottom: 6px;
}

.upgrade-btn {
  padding: 6px 12px;
  background: rgba(74, 222, 128, 0.2);
  border: 1px solid rgba(74, 222, 128, 0.4);
  border-radius: 6px;
  color: #4ade80;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upgrade-btn:hover {
  background: rgba(74, 222, 128, 0.3);
}

.market-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.market-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
}

.market-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.market-npc {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.quality-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}

.quality-normal {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.quality-rare {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.quality-epic {
  background: rgba(168, 85, 247, 0.2);
  color: #a78bfa;
}

.quality-legendary {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.market-name {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
}

.market-desc {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 8px;
}

.market-need {
  font-size: 11px;
  margin-bottom: 4px;
}

.market-need .label {
  color: rgba(255, 255, 255, 0.5);
}

.need-met {
  color: #4ade80;
}

.need-unmet {
  color: #f87171;
}

.market-reward {
  font-size: 11px;
  margin-bottom: 8px;
}

.market-reward .label {
  color: rgba(255, 255, 255, 0.5);
}

.reward-item {
  margin-right: 12px;
}

.market-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.market-btn {
  font-size: 12px;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.market-btn.cancel {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.market-btn.cancel:hover {
  background: rgba(255, 255, 255, 0.15);
}

.market-btn.deliver {
  background: rgba(74, 222, 128, 0.2);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.4);
}

.market-btn.deliver:hover {
  background: rgba(74, 222, 128, 0.3);
}

.market-btn.disabled {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.3);
  cursor: not-allowed;
}

.building-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
}

.building-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.building-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.3) 0%, rgba(34, 197, 94, 0.2) 100%);
  border-radius: 14px;
  color: #4ade80;
}

.building-info {
  flex: 1;
}

.building-name {
  font-size: 15px;
  font-weight: 600;
}

.building-desc {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

.bless-btn {
  padding: 8px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.bless-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.blessed {
  padding: 8px 16px;
  background: rgba(74, 222, 128, 0.2);
  border-radius: 8px;
  color: #4ade80;
  font-size: 12px;
}

.building-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.stat-value {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.delivery-tool-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tool-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
}

.tool-card.owned {
  border-color: rgba(74, 222, 128, 0.3);
}

.tool-card.delivering {
  background: rgba(16, 185, 129, 0.1);
}

.tool-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.tool-info {
  flex: 1;
}

.tool-name {
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.owned-tag {
  padding: 2px 6px;
  background: rgba(74, 222, 128, 0.2);
  border-radius: 4px;
  font-size: 10px;
  color: #4ade80;
}

.tool-stats {
  display: flex;
  gap: 12px;
  margin-top: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.tool-buy {
  text-align: right;
}

.tool-price {
  font-size: 12px;
  color: #ffd700;
  margin-bottom: 4px;
}

.tool-level {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  margin-bottom: 8px;
}

.buy-tool-btn {
  padding: 6px 12px;
  background: rgba(74, 222, 128, 0.2);
  border: 1px solid rgba(74, 222, 128, 0.4);
  border-radius: 6px;
  color: #4ade80;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.buy-tool-btn:hover {
  background: rgba(74, 222, 128, 0.3);
}

.tool-delivering,
.tool-idle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.tool-delivering {
  color: #10b981;
}

.delivering-icon {
  animation: bounce 1s infinite;
}

@keyframes bounce {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-3px);
  }
}

.tool-idle {
  color: rgba(255, 255, 255, 0.5);
}

.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px 16px;
  margin-top: 20px;
  color: rgba(255, 255, 255, 0.3);
  font-size: 11px;
}

.footer-sep {
  margin: 0 4px;
}

.toast-container {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toast-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: rgba(0, 0, 0, 0.85);
  border-radius: 8px;
  font-size: 12px;
  backdrop-filter: blur(10px);
  animation: toast-in 0.3s ease;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toast-item.toast-leaving {
  animation: toast-out 0.3s ease;
}

@keyframes toast-out {
  from {
    opacity: 1;
    transform: translateY(0);
  }

  to {
    opacity: 0;
    transform: translateY(-20px);
  }
}

.toast-success {
  color: #4ade80;
}

.toast-error {
  color: #f87171;
}

.toast-warning {
  color: #fbbf24;
}

.toast-info {
  color: #60a5fa;
}

.countdown-inline {
  display: inline;
  font-size: 12px;
  color: #4ade80;
}
</style>
