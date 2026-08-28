<template>
  <div class="farm-new">
    <div class="top-header">
      <div class="header-row">
        <div class="header-title" @click="$router.push('/userSettings/statistics')">
          <span class="title-text">{{ userName }}</span>
          <span class="title-sub">{{ globalStore.FARM_NAME }}</span>
        </div>
        <div class="wallet-info">
          <div v-for="walletAsset in walletAssets" :key="walletAsset.asset_id" class="wallet-item">
            <IconifyIcon v-if="walletAsset.asset_id !== 1" icon="ph:gem" width="16" class="gem-icon" />
            <span>{{ walletAsset.balance }}</span>
            <IconifyIcon v-if="walletAsset.asset_id === 1" :icon="globalStore.goldIcon" width="16" />
            <span v-else>{{ walletAsset.asset.name }}</span>
          </div>
        </div>
      </div>
      <div class="header-meta">
        <span class="level-num" :class="{ 'is-levelup': isLevelingUp }">Lv.{{ levelId }}</span>
        <span v-if="levelTitle" class="level-title">{{ levelTitle }}</span>
        <span class="exp-text">
          {{ exp }}/{{ nextLevelExp }}
          <IconifyIcon :icon="globalStore.expIcon" width="14" />
        </span>
      </div>
      <div class="exp-bar-bg" :class="{ 'is-levelup': isLevelingUp }">
        <div class="exp-bar-fill" :style="{ width: (isLevelingUp ? 100 : expProgress) + '%' }"></div>
      </div>
    </div>

    <!-- 集市 -->
    <div class="top-market">
      <div class="market-side">
        <div class="section-title">
          <IconifyIcon icon="mdi:storefront-outline" width="16" class="title-icon" />
          <span>集市</span>
        </div>
      </div>
      <div v-if="marketList.length > 0" class="market-list">
        <div v-for="item in marketList" :key="item.id"
          :class="['market-card', { ready: checkTaskRequirements(item) }]"
          @click="tryDeliverTask(item)">
          <div class="market-top">
            <div class="market-hero">
              <IconifyIcon icon="mdi:account-circle" width="32" />
            </div>
            <div class="market-rewards">
              <span class="reward-pill exp">
                +{{ item.farm_task.reward_exp }}
                <IconifyIcon :icon="globalStore.expIcon" width="12" />
              </span>
              <span class="reward-pill gold">
                +{{ item.farm_task.reward_gold }}
                <IconifyIcon :icon="globalStore.goldIcon" width="12" />
              </span>
            </div>
          </div>
          <div class="market-need">
            <div v-for="(status, idx) in getRequirementStatus(item)" :key="idx"
              :class="['need-box', status.isMet ? 'done' : 'need']">
              <IconFont v-if="status.icon" :name="status.icon" :size="16" />
              <IconifyIcon v-if="status.isMet" icon="mdi:check-circle" width="12" class="need-check" />
              <span v-else class="need-num">{{ status.current }}/{{ status.required }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="market-empty">暂无订单</div>
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
              tool.delivery_record.handbook?.selling_asset_name }}</span>
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
            <IconifyIcon v-else-if="land.status === 0" icon="meteocons:pollen-fill" width="28" />
            <IconifyIcon v-else-if="land.status === 3" icon="meteocons:code-yellow-fill" width="24" />
            <IconifyIcon v-else-if="land.status === 9" icon="mdi:lock-outline" width="28" />
          </div>
          <div class="land-info">
            <div class="land-name">{{ landName(land, index) }}</div>
            <div v-if="landMeta(land)" class="land-meta">{{ landMeta(land) }}</div>
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
            <div v-for="item in shops" :key="item.id"
              :class="['shop-item', { locked: !canBuyShopItem(item) }]">
              <div class="shop-icon" @click="openShopDetail(item)">
                <IconFont :name="item.handbook.icon" />
              </div>
              <div class="shop-info">
                <div class="shop-name" @click="openShopDetail(item)">{{ item.handbook.name }}</div>
                <div class="shop-meta">
                  <span>{{ item.handbook.quarter }}季</span>
                  <span class="shop-price">
                    <IconifyIcon icon="game-icons:gold-coin" width="14" />
                    {{ item.handbook.price }}
                  </span>
                  <span class="shop-level">Lv.{{ item.handbook.level_id }}</span>
                </div>
              </div>
              <button v-if="canBuyShopItem(item)" class="buy-btn" @click="buy(item)">购买</button>
              <span v-else class="buy-locked">Lv.{{ item.handbook.level_id }}</span>
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
              扩充 +{{ nextExtendSize }} ({{ nextExtendPrice }})
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

    <div v-if="showShopDetail" class="notice-overlay" @click.self="closeShopDetail">
      <div class="notice-popup shop-detail-popup">
        <div class="notice-popup-title">
          <IconFont v-if="shopDetailItem?.handbook?.icon" :name="shopDetailItem.handbook.icon" :size="22" />
          {{ shopDetailItem?.handbook?.name }}
        </div>
        <div class="shop-detail-body">
          <div v-if="shopDetailItem?.handbook?.description || shopDetailItem?.handbook?.desc" class="shop-detail-desc">
            {{ shopDetailItem.handbook.description || shopDetailItem.handbook.desc }}
          </div>
          <div class="shop-detail-row">
            <span>解锁等级</span>
            <span>Lv.{{ shopDetailItem?.handbook?.level_id }}</span>
          </div>
          <div class="shop-detail-row">
            <span>生长季数</span>
            <span>{{ shopDetailItem?.handbook?.quarter }}季</span>
          </div>
          <div v-if="shopDetailItem?.handbook?.quarter_exp" class="shop-detail-row">
            <span>收获经验</span>
            <span>+{{ shopDetailItem.handbook.quarter_exp }}</span>
          </div>
          <div class="shop-detail-row">
            <span>购买价格</span>
            <span>{{ shopDetailItem?.handbook?.price }}{{ shopDetailItem?.handbook?.asset?.name || '金币' }}</span>
          </div>
          <div v-if="shopDetailItem?.handbook?.selling_price" class="shop-detail-row">
            <span>售出价格</span>
            <span>{{ shopDetailItem.handbook.selling_price }}{{ shopDetailItem.handbook.selling_asset_name || '' }}</span>
          </div>
        </div>
        <button class="notice-popup-btn" @click="closeShopDetail">关闭</button>
      </div>
    </div>

    <div v-if="showNoticePopup" class="notice-overlay" @click.self="dismissNotice">
      <div class="notice-popup">
        <div class="notice-popup-title">
          <IconifyIcon icon="solar:megaphone-bold-duotone" width="20" />
          公告
        </div>
        <div class="notice-popup-body">{{ notice }}</div>
        <button class="notice-popup-btn" @click="dismissNotice">知道了</button>
      </div>
    </div>

    <div v-if="isLevelingUp" class="levelup-overlay">
      <div class="levelup-banner">
        <span class="levelup-emoji">🎉</span>
        <span>升级啦！Lv.{{ levelId }}</span>
        <span class="levelup-emoji">🎉</span>
      </div>
      <span
        v-for="p in levelupParticles"
        :key="p.id"
        class="levelup-particle"
        :style="p.style"
      >{{ p.emoji }}</span>
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
import { useGlobalStore } from '@/stores/global'
import { useFarmStore } from '@/stores/farm'
import IconFont from '@/components/IconFont.vue'

const globalStore = useGlobalStore()
const farmStore = useFarmStore()

const notice = ref('【公告】欢迎来到纯文字农场，每日签到世界树可获得丰富奖励，集市任务奖励丰厚哦')
const NOTICE_DATE_KEY = 'farm_notice_shown_date'
const showNoticePopup = ref(false)

const todayKey = () => {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

const maybeShowNotice = () => {
  if (!notice.value) return
  try {
    if (localStorage.getItem(NOTICE_DATE_KEY) !== todayKey()) {
      showNoticePopup.value = true
    }
  } catch {
    showNoticePopup.value = true
  }
}

const dismissNotice = () => {
  showNoticePopup.value = false
  try {
    localStorage.setItem(NOTICE_DATE_KEY, todayKey())
  } catch {
    // ignore
  }
}

const tabs = [
  { key: 'backpack', name: '背包', icon: 'mdi:bag-personal-outline' },
  { key: 'shop', name: '商店', icon: 'mdi:store-outline' },
  { key: 'fruit', name: '仓库', icon: 'mdi:warehouse' },
  { key: 'upgrade', name: '升级', icon: 'mdi:trending-up' },
  { key: 'building', name: '建筑', icon: 'mdi:storefront-outline' },
  // { key: 'delivery', name: '配送', icon: 'mdi:truck-outline' },
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

const showShopDetail = ref(false)
const shopDetailItem = ref(null)

const canBuyShopItem = (item) => {
  const needLevel = Number(item?.handbook?.level_id || 0)
  return levelId.value >= needLevel
}

const openShopDetail = (item) => {
  shopDetailItem.value = item
  showShopDetail.value = true
}

const closeShopDetail = () => {
  showShopDetail.value = false
  shopDetailItem.value = null
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

const isLevelingUp = ref(false)
const levelupParticles = ref([])
let levelupTimer = null
const LEVELUP_EMOJIS = ['🎉', '✨', '🎊', '⭐', '🌟']

const playLevelUp = () => {
  const particles = []
  for (let i = 0; i < 22; i++) {
    const dx = Math.round((Math.random() - 0.5) * 240)
    const dy = Math.round(-80 - Math.random() * 180)
    particles.push({
      id: i,
      emoji: LEVELUP_EMOJIS[i % LEVELUP_EMOJIS.length],
      style: {
        left: `${20 + Math.random() * 60}%`,
        top: '28%',
        fontSize: `${14 + Math.random() * 16}px`,
        animationDelay: `${Math.random() * 0.25}s`,
        animationDuration: `${1.1 + Math.random() * 0.7}s`,
        '--dx': `${dx}px`,
        '--dy': `${dy}px`,
      },
    })
  }
  levelupParticles.value = particles
  isLevelingUp.value = true
  if (levelupTimer) clearTimeout(levelupTimer)
  levelupTimer = setTimeout(() => {
    isLevelingUp.value = false
    levelupParticles.value = []
  }, 2200)
}

const addExp = async (expValue, actionName = '') => {
  if (expValue <= 0) return
  showToast({ message: `${actionName}经验+${expValue}`, type: 'success' })
  userInfo.value.exp += expValue

  if (userInfo.value.exp >= nextLevelExp.value) {
    showToast({ message: '恭喜你升级了！', type: 'success' })
    playLevelUp()
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

const getHandbookById = (id) => {
  const list = handbooks.value
  if (!list) return null
  if (!Array.isArray(list)) {
    return list[id] || list[String(id)] || list[Number(id)] || null
  }
  return list.find(h => Number(h.id) === Number(id)) || null
}

const getRequirementStatus = (task) => {
  if (!task.farm_task?.task_need) {
    return []
  }

  const fruits = fruitList.value || []

  return task.farm_task.task_need.map(need => {
    const needId = Number(need.handbook_id)
    const fruit = fruits.find(f =>
      Number(f.handbook_id) === needId ||
      Number(f.handbook?.id) === needId
    )
    const handbook = getHandbookById(need.handbook_id)
    const currentNum = fruit ? fruit.num : 0
    const requiredNum = need.quantity

    return {
      handbook_id: need.handbook_id,
      icon: handbook?.icon || fruit?.handbook?.icon || '',
      current: currentNum,
      required: requiredNum,
      isMet: currentNum >= requiredNum
    }
  })
}

const deliverTask = async (task) => {
  try {
    await farmStore.deliverTask(task.id)
    await addExp(task.farm_task.reward_exp, '任务')
    await updateAsset(task.farm_task.reward_asset_id, task.farm_task.reward_gold, 'add')
    await farmStore.fetchWarehouseList('fruit')
    await farmStore.fetchMarketList()
    showToast({ message: '任务完成！', type: 'success' })
  } catch (error) {
    showToast({ message: error || '交付失败', type: 'error' })
  }
}

const tryDeliverTask = (task) => {
  if (!checkTaskRequirements(task)) {
    showToast({ message: '货物不足', type: 'warning' })
    return
  }
  deliverTask(task)
}

const landName = (land, index) => {
  if (land.status === 0 || land.status === 9) {
    return '土地' + (index + 1)
  }
  if (land.status === 3) {
    return (land.handbook?.name || '作物') + '·枯萎'
  }
  return land.handbook?.name || '土地' + (index + 1)
}

const landMeta = (land) => {
  if (land.status === 1 && land.handbook) {
    return `${land.quarter}/${land.handbook.quarter}季`
  }
  if (land.status === 2 && land.handbook) {
    return `产出 ${land.residue_output}/${land.total_output} · ${land.quarter}/${land.handbook.quarter}季`
  }
  return ''
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
  if (!canBuyShopItem(item)) {
    showToast({ message: `需要达到 Lv.${item.handbook.level_id} 才能购买`, type: 'error' })
    return
  }

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
  maybeShowNotice()
  await init()
})

onUnmounted(() => {
  stopDeliveryCheck()
  if (levelupTimer) clearTimeout(levelupTimer)
})
</script>

<style scoped>
.farm-new {
  position: relative;
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
  padding: 12px 16px 10px;
  padding-top: calc(12px + env(safe-area-inset-top));
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.header-title {
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
  cursor: pointer;
}

.title-text {
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #00d4ff, #7b2cbf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title-sub {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  white-space: nowrap;
}

.wallet-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.wallet-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
}

.coin-icon {
  color: #ffd700;
}

.gem-icon {
  color: #00d4ff;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
}

.level-num {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}

.level-num.is-levelup {
  animation: level-pop 0.7s ease;
  color: #ffd700;
  text-shadow: 0 0 12px rgba(255, 215, 0, 0.8);
}

.level-title {
  color: rgba(255, 255, 255, 0.7);
}

.exp-text {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.exp-bar-bg {
  width: 100%;
  height: 4px;
  margin-top: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.exp-bar-bg.is-levelup {
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.55);
}

.exp-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #00d4ff 0%, #7b2cbf 100%);
  border-radius: 2px;
  transition: width 0.45s ease;
}

.exp-bar-bg.is-levelup .exp-bar-fill {
  background: linear-gradient(90deg, #ffd700 0%, #ff8c00 50%, #ffd700 100%);
  background-size: 200% 100%;
  animation: exp-shine 0.8s linear infinite;
}

.levelup-overlay {
  position: fixed;
  inset: 0;
  z-index: 180;
  pointer-events: none;
  overflow: hidden;
}

.levelup-banner {
  position: absolute;
  top: 18%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.25) 0%, rgba(123, 44, 191, 0.35) 100%);
  border: 1px solid rgba(255, 215, 0, 0.5);
  border-radius: 999px;
  font-size: 16px;
  font-weight: 700;
  color: #ffd700;
  white-space: nowrap;
  animation: banner-in 0.5s ease;
}

.levelup-emoji {
  display: inline-block;
  animation: emoji-spin 0.8s ease;
}

.levelup-particle {
  position: absolute;
  animation-name: particle-burst;
  animation-timing-function: ease-out;
  animation-fill-mode: forwards;
}

@keyframes level-pop {
  0% { transform: scale(1); }
  40% { transform: scale(1.45); }
  100% { transform: scale(1); }
}

@keyframes exp-shine {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

@keyframes banner-in {
  0% { opacity: 0; transform: translateX(-50%) translateY(12px) scale(0.85); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
}

@keyframes emoji-spin {
  0% { transform: rotate(-20deg) scale(0.6); }
  60% { transform: rotate(12deg) scale(1.2); }
  100% { transform: rotate(0) scale(1); }
}

@keyframes particle-burst {
  0% {
    opacity: 1;
    transform: translate(0, 0) scale(0.4) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: translate(var(--dx), var(--dy)) scale(1.15) rotate(50deg);
  }
}

.top-market {
  display: flex;
  align-items: stretch;
  margin: 6px 16px 0;
}

.market-side {
  /* flex: 2 1 0; */
  margin-right: 8px;
  min-width: 0;
  display: flex;
  align-items: center;
}

.market-side .section-title {
  font-size: 13px;
}

.top-market .market-list,
.top-market .market-empty {
  flex: 8 1 0;
  min-width: 0;
}

.top-market .market-list {
  display: flex;
  flex-direction: row;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 2px 6px;
}

.top-market .market-card {
  position: relative;
  min-width: 132px;
  max-width: 148px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  padding: 8px 8px 6px;
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
}

.top-market .market-card.ready {
  border-color: rgba(255, 215, 0, 0.55);
  box-shadow: 0 0 16px rgba(255, 215, 0, 0.35);
}

.top-market .market-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  margin-bottom: 2px;
}

.top-market .market-rewards {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
}

.reward-pill {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.28);
}

.reward-pill.exp {
  color: #fbbf24;
}

.reward-pill.gold {
  color: #ffd700;
}

.market-hero {
  position: relative;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.75);
}

.top-market .market-card.ready .market-hero {
  color: #ffd700;
}

.top-market .market-card.ready .market-hero::before {
  content: '';
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.45) 0%, rgba(255, 215, 0, 0.08) 55%, transparent 70%);
  animation: market-glow 1.6s ease-in-out infinite;
}

.top-market .market-need {
  justify-content: center;
  gap: 6px;
  margin: 4px 0 6px;
  min-height: 28px;
}

.top-market .need-box {
  width: 26px;
  height: 26px;
  border-radius: 6px;
}

.top-market .need-check {
  bottom: -3px;
  right: -3px;
  color: #4ade80;
}

.top-market .need-num {
  bottom: -8px;
  font-size: 8px;
}

@keyframes market-glow {
  0%, 100% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.12); }
}

.market-empty {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
  padding: 8px;
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notice-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.notice-popup {
  width: 100%;
  max-width: 320px;
  background: linear-gradient(180deg, #1f2a44 0%, #16213e 100%);
  border: 1px solid rgba(255, 193, 7, 0.35);
  border-radius: 16px;
  padding: 20px 18px 16px;
}

.notice-popup-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #ffc107;
  margin-bottom: 12px;
}

.notice-popup-body {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.85);
  margin-bottom: 16px;
}

.notice-popup-btn {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 193, 7, 0.2);
  color: #ffc107;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.delivery-panel {
  /* 底部配送面板 */
  position: fixed;
  left: 10%;
  bottom: 10px;
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
  font-size: 13px;
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
  min-width: 0;
  overflow: hidden;
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

.land-card.land-status-3 .land-icon {
  filter: saturate(0.85);
}

.land-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.land-name {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.land-meta {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.55);
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
  bottom: 4px;
  right: 4px;
  font-size: 10px;
  color: #06b6d4;
  cursor: pointer;
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-top: 4px;
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
  cursor: pointer;
  font-size: 12px;
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
  cursor: pointer;
}

.shop-info {
  flex: 1;
  min-width: 0;
}

.shop-name {
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
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

.shop-level {
  color: rgba(255, 255, 255, 0.45);
}

.shop-item.locked {
  opacity: 0.55;
}

.buy-locked {
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.45);
  font-size: 11px;
  white-space: nowrap;
}

.shop-detail-popup .notice-popup-title {
  gap: 8px;
}

.shop-detail-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
}

.shop-detail-desc {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.75);
}

.shop-detail-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
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
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.need-box {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: #fff;
}

.need-box.done {
  background: rgba(74, 222, 128, 0.2);
  border: 1px solid rgba(74, 222, 128, 0.5);
}

.need-box.need {
  background: rgba(255, 255, 255, 0.06);
  border: 1px dashed rgba(255, 255, 255, 0.25);
}

.need-check {
  position: absolute;
  bottom: -3px;
  right: -3px;
  color: #4ade80;
}

.need-num {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
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
