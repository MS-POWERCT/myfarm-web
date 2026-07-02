<template>
  <div class="farm-game">
    <!-- 顶部导航栏 -->
    <div class="top-nav">
      <div class="nav-logout" @click="logout">
        <!-- 退出登录 -->
        <IconifyIcon icon="basil:logout-solid" width="12" /> 退出登录
      </div>
      <div>
        <span class="clickable text-primary100" @click="router.push('/userSettings/statistics')">[修改信息]</span>&nbsp;
        <span>
          {{ userName }} -
          {{ globalStore.FARM_NAME }}
        </span>
      </div>
    </div>

    <!-- 状态栏 -->
    <div class="status-bar">
      <div class="status-item">
        <span class="text-gray500">等级</span>
        <span class="font-bold ml-4">Lv.{{ levelId }}</span>
      </div>
      <div class="status-item">
        <span class="text-gray500">修为</span>
        <span class="font-bold ml-4">{{ levelTitle }}</span>
      </div>
      <div class="status-item">
        <div>
          <span class="text-gray500">经验</span>
          <span class="font-bold ml-4">{{ exp }}/{{ nextLevelExp }}</span>
        </div>
        <div class="exp-bar">
          <div class="exp-fill" :style="{ width: expProgress + '%' }"></div>
        </div>
      </div>
      <div class="status-item" v-for="walletAsset in walletAssets" :key="walletAsset.asset_id">
        <span class="text-gray500">{{ walletAsset.asset.name }}</span>
        <span class="font-bold ml-4">{{ walletAsset.balance }}</span>
      </div>
    </div>


    <!-- 配送状态浮动面板 -->
    <div v-if="hasDeliveryingTools.length > 0" class="delivery-float-panel">
      <div v-for="tool in hasDeliveryingTools" :key="tool.id" class="delivery-float-item">
        <div class="float-tool-icon">
          <IconifyIcon :icon="tool.icon" width="18" />
        </div>
        <div class="float-tool-info">
          <div class="float-tool-name">{{ tool.name }}</div>
          <div class="float-tool-content">
            {{ tool.delivery_record.handbook?.name }} x{{ tool.delivery_record.num }}
          </div>
          <div class="float-tool-reward">
            <span class="text-gray500">收益：</span>
            <span>{{ tool.delivery_record.amount }}{{ tool.delivery_record.handbook?.selling_asset_name }}</span>
          </div>
          <div v-if="tool.delivery_record.status === 0" class="float-tool-time">
            <van-count-down :time="getDeliveryTime(tool.delivery_record.end_at)" format="mm:ss" class="text-primary100"
              @finish="onDeliveryFinish(tool)" />
          </div>
        </div>
      </div>
    </div>



    <!-- 集市任务区域 -->
    <div class="market-section" :key="JSON.stringify(fruitList)">
      <div class="market-tasks">
        <div v-for="item in marketList" :key="item.id" class="task-card">
          <div class="task-rewards">
            <span class="reward-item exp">经验 +{{ item.farm_task.reward_exp }}</span>
            <span class="reward-item gold">{{ item.farm_task.reward_gold }}</span>
          </div>
          <div class="task-items">
            <div v-for="(status, idx) in getRequirementStatus(item)" :key="idx"
              :class="['item-box', status.isMet ? 'done' : 'need']">
              <IconFont :name="handbooks[status.handbook_id].icon" width="24" />
              <IconifyIcon v-if="status.isMet" icon="mdi:check-circle" width="16" class="check-mark" />
              <span v-else class="item-num">{{ status.current }}/{{ status.required }}</span>
            </div>
          </div>
          <div class="task-npc">
            <!-- <div class="npc-circle">
              <IconifyIcon icon="mdi:account" width="22" />
            </div> -->
            <span class="npc-label">{{ item.farm_task.npc_name }}</span>
          </div>
          <div class="task-footer">
            <span v-if="checkTaskRequirements(item)" @click="deliverTask(item)" class="submit-btn">交付</span>
            <span v-else class="submit-btn disabled">货物不足</span>
          </div>
        </div>
        <div v-if="marketList.length === 0" class="no-tasks">
          <span>暂无任务</span>
        </div>
      </div>
    </div>


    <!-- 土地区域 -->
    <div class="land-section">
      <div class="section-tabs">
        <transition name="fade" mode="out-in">
          <van-notice-bar v-if="showNotice" key="notice" scrollable background="transparent" color="#fff" :text="notice"
            class="notice-bar" />
          <span v-else key="tab" class="tab-btn active">我的土地</span>
        </transition>
        <!-- <span class="tab-btn">我的池塘</span> -->
      </div>

      <!-- 土地列表 -->
      <div class="land-list">
        <div v-for="(land, index) in lands" :key="index" class="land-item">
          <!-- {{ land }} -->
          <span class="land-num">{{ index + 1 }}.</span>
          <span :class="[getLandLevelClass(land.level_id)]">[{{ land.level.short_name }}]</span>
          <span class="land-name">
            <span v-if="land.status === 1 || land.status === 2">
              <IconFont :name="land.handbook.icon" />
            </span>
            {{ landName(land, index) }}
            <van-count-down v-if="land.status === 1" class="land-count-down inline-block text-gray500"
              @finish="onFinish(land.id)" :time="getTime(land.plant_mature_at)" format="HH:mm:ss" />
          </span>
          <span class="land-status">[{{ landStatus(land.status) }}]</span>
          <span v-if="land.status === 0" class="land-action" @click="sow(land.id, index + 1)">播种</span>
          <span v-if="land.status === 1" class="land-action text-center">
            <IconFont name="icon-sanweishengchangmonixianshi" />
          </span>
          <span v-if="land.status === 2" class="land-action" @click="harvest(land)">收获</span>
          <span v-if="land.status === 3" class="land-action" @click="clearland(land.id)">铲除</span>
          <span v-if="land.status === 9" class="land-action" @click="switchTab('upgrade')">开垦</span>
        </div>
      </div>
    </div>

    <!-- 操作工具栏 -->
    <div class="tool-bar">
      <span class="tool-btn" @click="init()">刷新</span>

      <span v-if="hasClearableLands" class="tool-btn" @click="clearAll()">一健铲除</span>
      <span v-if="hasHarvestableLands" class="tool-btn" @click="harvestAll()">一键收获</span>
      <span v-if="isChoiceMode && hasEmptyLands" class="tool-btn" @click="doPlantAll()">一键种植</span>

    </div>

    <!-- 功能选择区域 -->
    <div class="function-section">
      <div class="function-tabs">
        <span class="function-tab" :class="{ active: currentFunction === 'backpack' }" @click="switchTab('backpack')">
          背包种子
        </span>
        <span class="function-tab" :class="{ active: currentFunction === 'fruit' }" @click="switchTab('fruit')">
          我的仓库
        </span>
        <span class="function-tab" :class="{ active: currentFunction === 'shop' }" @click="switchTab('shop')">
          种子商店
        </span>

        <span class="function-tab" :class="{ active: currentFunction === 'building' }" @click="switchTab('building')">
          特殊建筑
        </span>
        <span class="function-tab" :class="{ active: currentFunction === 'delivery' }" @click="switchTab('delivery')">
          配送工具
        </span>
        <span class="function-tab" :class="{ active: currentFunction === 'upgrade' }" @click="switchTab('upgrade')">
          土地升级
        </span>

        <!-- <span class="function-tab" :class="{ active: currentFunction === 'tool' }" @click="switchTab('tool')">
          游戏工具
        </span> -->
      </div>


      <!-- 背包种子 -->
      <div v-if="currentFunction === 'backpack'" class="function-list">
        <div class="text-center text-gray500">
          <span v-if="isChoiceMode">
            已选择【{{ selectedHandbookName }}】&nbsp;&nbsp;<span class="text-primary100" @click="cancelChoice">[取消]</span>
          </span>
          <span v-else>
            请选择要种植的种子
          </span>
        </div>
        <div v-if="seedList.length > 0">
          <div v-for="seed in seedList" :key="seed.name"
            :class="{ 'function-item-active': selectedHandbookId === seed.handbook_id }" class="function-item">
            <span style="width: 120px;">
              <IconFont :name="seed.handbook.icon" />
              {{ seed.handbook.name }}
              <span>{{ seed.handbook.quarter }}季</span>
            </span>
            <span>x {{ seed.num }}</span>
            <!-- 种植模式下显示种植按钮 -->
            <span class="clickable text-primary100"
              @click="doChoice(seed.handbook_id, seed.handbook.name)">[选择种植]</span>
          </div>
        </div>
        <!-- 空状态提示 -->
        <div v-else class="empty-tip">
          背包里什么都没有哦
        </div>
      </div>

      <!-- 商店内容 -->
      <div v-if="currentFunction === 'shop'" class="function-list">
        <div class="text-center text-gray500 mb-2">
          <span>购买数量：</span>
          <div class="stepper">
            <span class="stepper-btn" @click="decreaseBuyQty">-</span>
            <input type="number" v-model.number="globalBuyQuantity" min="1" class="stepper-input" />
            <span class="stepper-btn" @click="increaseBuyQty">+</span>
          </div>
        </div>
        <div v-if="shops.length > 0">
          <div v-for="item in shops" :key="item.id" class="function-item">
            <span class="item-name" style="width: 120px;">
              <IconFont :name="item.handbook.icon" />
              {{ item.handbook.name }}
            </span>
            <span>
              <span>{{ item.handbook.quarter }}季</span>&nbsp;&nbsp;
              <span>{{ item.handbook.price }}{{ item.handbook.asset.name }}</span>
            </span>
            <span>
              <span class="mr-4"></span>
              <span class="buy-btn" @click="buy(item)">[购买]</span>
            </span>
          </div>
        </div>
        <div v-else class="empty-tip">
          商店暂时没有商品
        </div>
      </div>

      <!-- 我的仓库 -->
      <div v-if="currentFunction === 'fruit'" class="function-list">
        <div class="text-center">
          <span class="text-gray500">我的仓库大小 {{ warehouseUse }} / {{ warehouseSize }}</span>&nbsp;&nbsp;&nbsp;
          <span v-if="nextExtendPrice > 0" class="text-primary100" @click="extendWarehouse">
            [扩充{{ nextExtendSize }}个位置{{ nextExtendPrice }}灵石]
          </span>
          <span v-else class="text-gray500">[我的仓库最大容量]</span>
        </div>
        <div v-if="fruitList.length > 0">
          <div v-for="fruit in fruitList" :key="fruit.name" class="function-item">
            <span class="item-name">
              <span>
                <IconFont :name="fruit.handbook.icon" />
                {{ fruit.handbook.name }}
                x {{ fruit.num }}
              </span>&nbsp;&nbsp;&nbsp;
              <span class="text-gray500">
                售价: {{ fruit.handbook.selling_price }}{{ fruit.handbook.selling_asset_name }}
              </span>
            </span>
            <span v-if="isHaveDeliveryTool" class="delivery-trigger">
              <span class="text-primary100" @click="clickDelivery(fruit)">[送货]</span>
              <!-- 配送工具横向浮动列表 -->
              <div v-if="showDeliveryPopup && selectedFruit?.handbook_id === fruit.handbook_id"
                class="delivery-tools-float">
                <span v-for="tool in availableDeliveryTools" :key="tool.id" class="delivery-tool-item"
                  @click="selectDeliveryTool(tool)">
                  <IconifyIcon :icon="tool.icon" width="16" />
                  <span class="float-tip">{{ tool.name }}</span>
                </span>
                <span :style="{ width: '100px' }" v-if="availableDeliveryTools.length === 0"
                  class="text-gray500">[无配送工具]</span>
              </div>
            </span>
          </div>
        </div>
        <div v-else class="empty-tip">
          我的仓库里什么都没有哦
        </div>
      </div>

      <!-- 土地升级内容 -->
      <div v-if="currentFunction === 'upgrade'" class="function-list">
        <div v-for="upgrade in landUpgradeInfo" :key="upgrade.id" class="upgrade-item">
          <span class="upgrade-desc">{{ upgrade.desc }} &nbsp;
            <IconifyIcon icon="hugeicons:land-plot" width="14" />
          </span>
          <span>等级：Lv{{ upgrade.required_level }}</span>
          <span class="upgrade-cost">灵石：{{ upgrade.price }}</span>
          <span class="upgrade-btn" @click="upgradeLand(upgrade)">{{ upgrade.bottom }}</span>
        </div>
        <div class="empty-tip">
          暂无升级信息
        </div>
      </div>


      <!-- 特殊建筑内容 -->
      <div v-if="currentFunction === 'building'" class="function-list">
        <!-- 世界树 -->
        <div class="building-item">
          <div class="building-header">
            <span class="building-name">
              世界树
            </span>
            <IconifyIcon icon="streamline-emojis:christmas-tree" width="30" />
            <span v-if="worldTree.is_click === 0" class="building-action" @click="clickWorldTree">[获得祝福]</span>
            <span v-else class="text-gray500">[今日已祝福]</span>
          </div>
          <div class="building-stats">
            <div class="stat-row">
              <span class="text-gray500">获得祝福奖励：</span>
              <span>经验+{{ worldTree.exp }} &nbsp; 灵石+{{ worldTree.gold }}</span>
            </div>
            <div class="stat-row">
              <span class="text-gray500">累计祝福奖励：</span>
              <span>经验+{{ worldTree.total_exp }} &nbsp; 灵石+{{ worldTree.total_gold }}</span>
            </div>
            <div class="stat-row">
              <span class="text-gray500">祝福次数：</span>
              <span>{{ worldTree.click_count }}次</span>
            </div>
          </div>
        </div>
      </div>


      <!-- 配送工具内容 -->
      <div v-if="currentFunction === 'delivery'" class="function-list">
        <div v-for="tool in deliveryTools" :key="tool.id" class="delivery-item">
          <div class="delivery-header">
            <span class="delivery-name">
              <IconifyIcon :icon="tool.icon" width="22" class="mr-8" />
              {{ tool.name }}
            </span>
            <span v-if="tool.is_have === 0" class="text-gray500">[未拥有]</span>
          </div>
          <div class="delivery-stats">
            <span class="text-gray500">容量：</span>
            <span>{{ tool.capacity }}个</span>&nbsp;
            <span class="text-gray500">配送：</span>
            <span>{{ tool.delivery_time }}分钟</span>&nbsp;

          </div>
          <div class="delivery-footer" v-if="tool.is_have === 0">
            <span class="delivery-price">等级达到：Lv.{{ tool.level_id }}</span>
            <span class="delivery-price">{{ tool.price }}{{ tool.asset_name }}</span>
            <span class="text-primary100" @click="buyDeliveryTool(tool)">[购买]</span>
          </div>
        </div>
        <div v-if="deliveryTools.length === 0" class="empty-tip">
          暂无配送工具
        </div>
      </div>

    </div>

    <!-- 农场日志区域 -->
    <!-- <div class="log-section">
      <div class="log-list">
        <div v-for="log in farmLogs" :key="log.id" class="log-item">
          <span class="log-time">[{{ log.time }}]</span>
          <span>{{ log.detail }}</span>
        </div>
      </div>
    </div> -->

    <!-- 底部版权 -->
    <div class="footer">
      ━━━━━━━━━━━━━━━━━━<br>
      纯文字农场 ｜ 2026 Self Youth
      ━━━━━━━━━━━━━━━━━━<br>
      测试开发中，数据后面会被清除
    </div>
  </div>

  <!-- 消息队列显示区域 -->
  <div class="message-queue">
    <transition-group name="toast">
      <div v-for="msg in messages" :key="msg.id"
        :class="['toast-item', `toast-${msg.type}`, { 'toast-leaving': !msg.visible }]">
        {{ msg.text }}
      </div>
    </transition-group>
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

// 通知栏
const notice = ref('【公告】欢迎来到纯文字农场，每日签到世界树可获得经验和灵石，集市任务奖励丰厚哦')
const showNotice = ref(false)

const NOTICE_STORAGE_KEY = 'farm_notice_date'

const shouldShowNotice = () => {
  const today = new Date().toDateString()
  const lastShown = localStorage.getItem(NOTICE_STORAGE_KEY)
  return lastShown !== today
}

const hideNotice = () => {
  setTimeout(() => {
    showNotice.value = false
    localStorage.setItem(NOTICE_STORAGE_KEY, new Date().toDateString())
  }, 8000)
}


// 功能标签持久化
const STORAGE_KEY = 'farm_active_tab'
const currentFunction = ref('backpack')
// 切换标签
const switchTab = (tab) => {
  currentFunction.value = tab
}

// 从 localStorage 恢复保存的标签
const loadSavedTab = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && ['backpack', 'shop', 'fruit', 'tool', 'upgrade', 'building', 'delivery'].includes(saved)) {
    currentFunction.value = saved
  }
}

// 保存当前标签到 localStorage
const saveCurrentTab = () => {
  localStorage.setItem(STORAGE_KEY, currentFunction.value)
}

// 监听标签变化，自动保存
watch(currentFunction, () => {
  saveCurrentTab()
})

// 消息队列系统
const messages = ref([])
let messageId = 0

// 全局购买数量
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

// 送货模式状态
const showDeliveryPopup = ref(false)
const selectedFruit = ref(null)

// 点击送货按钮
const clickDelivery = (fruit) => {
  if (showDeliveryPopup.value && selectedFruit.value?.handbook_id === fruit.handbook_id) {
    showDeliveryPopup.value = false
    selectedFruit.value = null
  } else {
    selectedFruit.value = fruit
    showDeliveryPopup.value = true
  }
}

// 获取可用的配送工具
const availableDeliveryTools = computed(() => {
  return deliveryTools.value.filter(tool => tool.is_have === 1 && tool.is_delivery !== 1)
})

// 选择配送工具
const selectDeliveryTool = async (tool) => {
  if (!selectedFruit.value) return

  // 检查果实数量是否满足配送工具容量
  // if (selectedFruit.value.num < tool.capacity) {
  //   showToast({ message: `数量不足，至少需要${tool.capacity}个`, type: 'error' })
  //   return
  // }

  try {
    await farmStore.useDeliveryTool(tool.id, selectedFruit.value.handbook_id)
    showToast({ message: `开始配送${selectedFruit.value.handbook.name}！`, type: 'success' })
    showDeliveryPopup.value = false
    selectedFruit.value = null
    // 刷新配送工具列表和我的仓库
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

//土地时间计算
const getTime = (time) => {
  const now = new Date()
  const targetTime = new Date(time)
  return Math.floor(targetTime.getTime() - now.getTime())
}

// 配送时间计算（返回非负数）
const getDeliveryTime = (time) => {
  const now = new Date()
  const targetTime = new Date(time)
  const diff = Math.floor(targetTime.getTime() - now.getTime())
  return diff > 0 ? diff : 0
}

// 配送完成标记（防止重复触发）
const completedDeliveries = new Set()

// 结算配送奖励
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

// 配送完成刷新
const onDeliveryFinish = async (tool) => {
  await settleDelivery(tool)
}

// 配送状态检查定时器
let deliveryCheckTimer = null

// 检查并结算超时配送（定时调用）
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

// 启动配送状态检查定时器（每秒检查一次）
const startDeliveryCheck = () => {
  if (deliveryCheckTimer) return
  deliveryCheckTimer = setInterval(() => {
    checkTimeoutDeliveries()
  }, 1000)
}

// 停止配送状态检查定时器
const stopDeliveryCheck = () => {
  if (deliveryCheckTimer) {
    clearInterval(deliveryCheckTimer)
    deliveryCheckTimer = null
  }
}

// 显示提示消息
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

  // 3秒后开始淡出
  setTimeout(() => {
    const index = messages.value.findIndex(m => m.id === id)
    if (index > -1) {
      messages.value[index].visible = false
      // 动画结束后移除消息
      setTimeout(() => {
        const idx = messages.value.findIndex(m => m.id === id)
        if (idx > -1) {
          messages.value.splice(idx, 1)
        }
      }, 500)
    }
  }, 3000)
}

// 增加经验并检查升级
const addExp = async (expValue, actionName = '') => {
  if (expValue <= 0) return

  // 显示经验增加提示
  showToast({ message: `${actionName}经验+${expValue}`, type: 'success' })

  // 更新用户经验
  userInfo.value.exp += expValue

  // 检查是否需要升级
  if (userInfo.value.exp >= nextLevelExp.value) {
    showToast({ message: '恭喜你升级了！', type: 'success' })
    // 重新获取用户信息
    await farmStore.fetchFarmInfo()
  }
}

// 资产变动函数（增加或扣除）
const updateAsset = async (assetId, amount, action = 'add') => {
  // 查找对应的资产
  const asset = walletAssets.value.find(a => a.asset_id === assetId)

  if (!asset) {
    console.error(`未找到资产 ID: ${assetId}`)
    return false
  }

  // 确保当前余额是数字
  const currentBalance = Number(asset.balance)
  const changeAmount = Number(amount)

  if (action === 'deduct') {
    // 扣除操作：检查余额是否足够
    if (currentBalance < changeAmount) {
      showToast({ message: `${asset.asset.name}不足`, type: 'warning' })
      return false
    }
    // 执行扣除
    asset.balance = currentBalance - changeAmount
    showToast({ message: `${asset.asset.name}-${changeAmount}`, type: 'info' })
  } else {
    // 增加操作
    asset.balance = currentBalance + changeAmount
    showToast({ message: `${asset.asset.name}+${changeAmount}`, type: 'success' })
  }

  return true
}

// 使用 computed 缓存常用值，减少重复访问
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

const hasClearableLands = computed(() => {
  return lands.value.some(l => l.status === 3)
})

const hasHarvestableLands = computed(() => {
  return lands.value.some(l => l.status === 2)
})

const hasEmptyLands = computed(() => {
  return lands.value.some(l => l.status === 0)
})

// 点击世界树获得祝福
const clickWorldTree = async () => {
  try {
    await farmStore.clickWorldTree()
    // 增加经验和金币
    await addExp(worldTree.value.exp, '世界树')
    await updateAsset(1, worldTree.value.gold, 'add')
    showToast({ message: '获得世界树的祝福！', type: 'success' })
    // 刷新特殊建筑信息
    await farmStore.getSpecialInfo()
  } catch (error) {
    showToast({ message: error || '点击世界树失败', type: 'error' })
  }
}

// 检查我的仓库货物是否满足任务需求
const checkTaskRequirements = (task) => {
  if (!task.farm_task?.task_need || !fruitList.value || fruitList.value.length === 0) {
    return false
  }

  for (const need of task.farm_task.task_need) {
    // 尝试两种方式匹配：handbook_id 或 handbook.id，并确保类型一致
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

// 获取任务需求的完成状态
const getRequirementStatus = (task) => {
  if (!task.farm_task?.task_need || !fruitList.value || fruitList.value.length === 0) {
    return []
  }

  return task.farm_task.task_need.map(need => {
    // 尝试两种方式匹配：handbook_id 或 handbook.id，并确保类型一致
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

// 交付集市任务
const deliverTask = async (task) => {
  try {
    await farmStore.deliverTask(task.id)

    // 增加经验和金币奖励
    await addExp(task.farm_task.reward_exp, '任务')
    await updateAsset(task.farm_task.reward_asset_id, task.farm_task.reward_gold, 'add')

    // 刷新我的仓库
    await farmStore.fetchWarehouseList('fruit')

    showToast({ message: '任务完成！', type: 'success' })
  } catch (error) {
    showToast({ message: error || '交付失败', type: 'error' })
  }
}

// 放弃集市任务
// const cancelTask = async (task) => {
//   try {
//     // 执行放弃
//     await farmStore.cancelTask(task.id)
//     showToast({ message: '已放弃任务', type: 'info' })
//   } catch (error) {
//     showToast({ message: '操作失败' + error, type: 'error' })
//   }
// }

// 返回土地名称
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

// 返回土地级别对应的CSS类名
const getLandLevelClass = (level_id) => {
  switch (level_id) {
    case 2:
      return 'land-level-red'
    case 3:
      return 'land-level-gold'
  }
}

// 返回土地的状态
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

// 农场日志数据
// const farmLogs = ref([
//   { id: 1, time: '06:00', detail: '【系统】新的一天开始了' },
// ])

// 刷新土地数据
const onFinish = async (land_id) => {
  await farmStore.LandRefresh(land_id)
}

// 点击播种
const sow = (id) => {
  // 切换到背包tab
  switchTab('backpack')

  // 如果是选择模式，不允许播种
  if (isChoiceMode.value) {
    selectedLandId.value = id
    doPlant(selectedHandbookId.value)
    return
  }
}
// 点击一健播种
const doPlantAll = async () => {
  if (!isChoiceMode.value) return

  // 获取种子数量
  const seed = seedList.value.find(s => s.handbook_id === selectedHandbookId.value)
  if (!seed) {
    showToast({ message: '该种子已用完', type: 'error' })
    return
  }

  // 获取空闲土地列表
  const emptyLands = lands.value.filter(l => l.status === 0)
  const seedCount = seed.num
  const plantCount = Math.min(seedCount, emptyLands.length)

  if (plantCount === 0) {
    showToast({ message: '没有可种植的土地', type: 'warning' })
    return
  }

  if (!isChoiceMode.value) return

  // 获取种子数量
  await farmStore.plantAll({ handbook_id: selectedHandbookId.value })

  showToast({ message: `成功种植${plantCount}块地！`, type: 'success' })

  // 种子扣除
  // 更新该背包种子-1
  const index = seedList.value.findIndex(seed => seed.handbook_id === selectedHandbookId.value);
  if (index !== -1) {
    const seed = seedList.value[index];
    seed.num -= plantCount;
    if (seed.num <= 0) {
      seedList.value.splice(index, 1); // 删除该种子
    }
  }
  // 取消选择种植
  cancelChoice()
  // 增加种植经验
  await addExp(userInfo.value.default_exp.plant * plantCount, '种植')

}

// 执行种植
const doPlant = async (handbook_id) => {
  if (!selectedLandId.value) {
    showToast({ message: '请先选择土地', type: 'warning' })
    return
  }

  // 找到对应的土地
  const land = lands.value.find(l => l.id === selectedLandId.value)
  if (!land) {
    showToast({ message: '土地不存在', type: 'error' })
    return
  }

  // 如果不是空闲土地，不允许种植
  if (land.status !== 0) {
    showToast({ message: '该土地不是空闲状态', type: 'warning' })
    return
  }

  await farmStore.plant({ handbook_id: handbook_id, land_id: selectedLandId.value })

  // 更新该背包种子-1
  const index = seedList.value.findIndex(seed => seed.handbook_id === handbook_id);
  if (index !== -1) {
    const seed = seedList.value[index];
    seed.num--;
    if (seed.num <= 0) {
      seedList.value.splice(index, 1); // 删除该种子

      // 取消选择种植
      cancelChoice()
    }
  }

  // 增加种植经验
  await addExp(userInfo.value.default_exp.plant, '种植')

}
// 执行选择
const doChoice = async (handbook_id, handbook_name) => {
  selectedHandbookId.value = handbook_id
  selectedHandbookName.value = handbook_name
  isChoiceMode.value = true
}

// 取消选择
const cancelChoice = () => {
  isChoiceMode.value = false
  selectedHandbookId.value = null
  selectedHandbookName.value = null
}
// 点击铲除
const clearland = async (id) => {
  // 判断土地是否生长中状态
  const land = lands.value.find(l => l.id === id)
  if (land.status == 2) {
    return
  }
  // 调用移除土地接口
  farmStore.landRemove({ land_id: id })
  // 增加铲除土地经验
  await addExp(userInfo.value.default_exp.shovel, '铲除土地')
}

// 点击一健铲除
const clearAll = async () => {
  // 获取生长中土地列表
  const growingLands = lands.value.filter(l => l.status === 3)
  if (growingLands.length === 0) {
    showToast({ message: '没有可铲除的土地', type: 'warning' })
    showToast({ message: '一键铲除无法铲除生长中的的作物', type: 'warning' })
    return
  }

  // 调用一键铲除所有土地接口
  await farmStore.LandRemoveAll()
  // 经验
  await addExp(userInfo.value.default_exp.shovel * growingLands.length, '铲除土地')
  showToast({ message: `成功铲除${growingLands.length}块地`, type: 'success' })
}

// 点击收获
const harvest = async (land) => {

  // 回跳到我的仓库tab
  // switchTab('fruit')

  try {

    await farmStore.LandHarvest(land.id)

    await farmStore.fetchWarehouseList('fruit') // 刷新仓库信息

    // 提示收获成功
    showToast({ message: `收获成功，获得${land.residue_output}个${land.handbook.name}`, type: 'success' })
    // 增加经验
    await addExp(land.handbook.quarter_exp, `收获${land.handbook.name}`)
    // 刷新集市任务状态
    await farmStore.fetchMarketList()
  } catch (error) {
    showToast({ message: error || '收获失败', type: 'error' })
  }
}
// 一键收获
const harvestAll = async () => {
  try {

    // 判断是否有可收获的土地
    const growingLands = lands.value.filter(l => l.status === 2)
    if (growingLands.length === 0) {
      showToast({ message: '没有可收获的土地', type: 'warning' })
      return
    }

    await farmStore.LandHarvestAll()

    // 计算得到的经验
    const totalExp = growingLands.reduce((acc, land) => acc + land.handbook.quarter_exp, 0)
    // 增加经验
    await addExp(totalExp, `收获${growingLands.length}块土地`)

    // 提示收获成功
    showToast({ message: `一键收获成功，获得${totalExp}点经验`, type: 'success' })
    // 刷新仓库和集市任务状态
    await farmStore.fetchWarehouseList('fruit')
    await farmStore.fetchMarketList()
  } catch (error) {
    showToast({ message: error || '一键收获失败', type: 'error' })
  }
}

// 点击购买
const buy = async (item) => {

  const num = globalBuyQuantity.value
  const spent = num * item.handbook.price
  try {
    // 先扣除金币
    const deducted = await updateAsset(item.handbook.asset_id, spent, 'deduct')
    if (!deducted) {
      return // 余额不足，已在 updateAsset 中提示
    }

    const result = await farmStore.shopBuy(item, num)
    if (result.success) {
      // 刷新背包数据
      await farmStore.fetchWarehouseList('seed')
      showToast({ message: `购买${num}个${item.handbook.name}成功`, type: 'success' })
    } else {
      // 金币不足，回滚购买
      await updateAsset(item.handbook.asset_id, spent, 'add')
    }
  } catch (error) {
    // 失败时回滚金币
    await updateAsset(item.handbook.asset_id, spent, 'add')
    showToast({ message: error || '购买失败', type: 'error' })
  }
}

// 土地升级
const upgradeLand = async (upgrade) => {
  try {

    // 判断等级是否满足
    if (levelId.value < upgrade.required_level) {
      showToast({ message: `需要达到 Lv.${upgrade.required_level} 才能升级`, type: 'error' })
      return
    }

    // 先扣除金币
    const deducted = await updateAsset(1, upgrade.price, 'deduct')
    if (!deducted) {
      return // 余额不足，已在 updateAsset 中提示
    }

    await farmStore.upgradeLand(upgrade.upgrade_type)
    showToast({ message: `土地${upgrade.bottom}成功`, type: 'success' })

    // 刷新土地升级信息
    await farmStore.getLandUpgradeInfo()
  } catch (error) {
    // 失败时回滚金币
    await updateAsset(1, upgrade.price, 'add')
    showToast({ message: error || '土地升级/开垦失败', type: 'error' })
  }
}

// 扩充我的仓库
const extendWarehouse = async () => {
  try {
    // 先扣除金币
    const deducted = await updateAsset(1, nextExtendPrice.value, 'deduct')
    if (!deducted) {
      return // 余额不足，已在 updateAsset 中提示
    }

    await farmStore.extendWarehouse()
    showToast({ message: `我的仓库扩充成功，新增${nextExtendSize.value}个位置`, type: 'success' })

    // 刷新我的仓库信息
    await farmStore.fetchFarmInfo()
    await farmStore.fetchWarehouseList('fruit')
  } catch (error) {
    // 失败时回滚金币
    await updateAsset(1, nextExtendPrice.value, 'add')
    showToast({ message: error || '我的仓库扩充失败', type: 'error' })
  }
}


// 购买配送工具
const buyDeliveryTool = async (tool) => {
  // 检查等级是否满足
  if (levelId.value < tool.level_id) {
    showToast({ message: `需要达到 Lv.${tool.level_id} 才能购买`, type: 'error' })
    return
  }

  // 扣除金币
  const deducted = await updateAsset(tool.asset_id, tool.price, 'deduct')
  if (!deducted) {
    return // 余额不足，已在 updateAsset 中提示
  }

  try {
    await farmStore.buyDeliveryTool(tool.id)
    showToast({ message: `购买${tool.name}成功！`, type: 'success' })
    // 刷新配送工具列表
    await farmStore.getDeliveryToolList()
  } catch (error) {
    // 失败时回滚金币
    await updateAsset(tool.asset_id, tool.price, 'add')
    showToast({ message: error || '购买配送工具失败', type: 'error' })
  }
}

const init = async () => {
  await farmStore.fetchFarmInfo() // 初始化农场信息
  await farmStore.fetchLands() // 初始化土地信息
  await farmStore.fetchShops() // 初始化商店信息
  await farmStore.fetchWarehouseList('seed') // 初始化种子我的仓库信息
  await farmStore.fetchWarehouseList('fruit') // 初始化水果我的仓库信息
  await farmStore.fetchMarketList() // 初始化集市列表信息
  await farmStore.getLandUpgradeInfo() // 初始化土地升级/开垦信息
  await farmStore.getSpecialInfo() // 初始化特殊建筑信息
  await farmStore.getDeliveryToolList() // 初始化配送工具列表
  startDeliveryCheck() // 启动配送状态检查定时器
}

const logout = async () => {
  await userStore.logout()
  router.push('/login')
}

onMounted(async () => {
  loadSavedTab() // 恢复保存的标签
  if (shouldShowNotice()) {
    showNotice.value = true
    hideNotice()
  }
  await init()
})

onUnmounted(() => {
  stopDeliveryCheck() // 停止配送状态检查定时器
})
</script>

<style scoped>
.farm-game {
  min-height: 100vh;
  background-color: var(--black100);
  color: var(--white);
  padding: 6px;
  font-family: 'Microsoft YaHei', sans-serif;
  font-size: 12px;
}

.text-green {
  color: var(--green);
}

.text-red {
  color: var(--red);
}

.text-primary100 {
  color: var(--primary100);
  cursor: pointer;
}

.text-primary100:hover {
  text-decoration: underline;
}

.clickable {
  cursor: pointer;
}

.clickable:hover {
  text-decoration: underline;
}

.task-ready-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  color: var(--green);
  font-size: 12px;
  animation: pulse-badge 2s ease-in-out infinite;
}

@keyframes pulse-badge {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

.task-actions {
  margin-top: 8px;
}

.task-btn {
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.task-btn.deliver-ready {
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  animation: glow-deliver 1.5s ease-in-out infinite;
}

@keyframes glow-deliver {

  0%,
  100% {
    box-shadow: 0 0 4px rgba(34, 197, 94, 0.3);
  }

  50% {
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
  }
}

.task-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px;
  background: var(--black100);
}

.nav-logout {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}


.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 3px 6px;
  background: var(--black100);
  /* border: 1px solid var(--gray500); */
  margin-bottom: 8px;
}

.section-tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 6px 12px;
  background: var(--black100);
  border: 1px solid var(--gray500);
  border-bottom: none;
}

.tab-btn {
  color: var(--gray500);
  cursor: pointer;
}

.tab-btn.active {
  color: var(--white);
  font-weight: bold;
}

/* 经验条样式 */
.exp-bar {
  height: 4px;
  background: var(--gray500);
}

.exp-fill {
  height: 100%;
  background: var(--green);
}

/* 配送状态浮动面板 */
.delivery-float-panel {
  position: fixed;
  left: 6px;
  top: 150px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.delivery-float-item {
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid var(--gray500);
  border-radius: 4px;
  padding: 3px;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 120px;
}

.float-tool-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(64, 158, 255, 0.2);
  border-radius: 4px;
  width: 28px;
  height: 28px;
}

.float-tool-info {
  flex: 1;
  font-size: 12px;
}

.float-tool-name {
  color: var(--white);
  font-weight: bold;
}

.float-tool-content {
  color: var(--gray500);
  margin-top: 2px;
}

.float-tool-reward {
  margin-top: 2px;
}

.float-tool-time {
  margin-top: 4px;
  font-size: 12px;
}

/* 土地 */

.land-section {
  margin-bottom: 8px;
}

.land-level-red {
  color: var(--land-level-red);
}

.land-level-gold {
  color: var(--land-level-gold);
}

.land-list {
  border: 1px solid var(--gray500);
}

.land-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  /* border-bottom: 1px dashed var(--gray500); */
  gap: 8px;
}

.land-item:last-child {
  border-bottom: none;
}

.land-num {
  width: 12px;
  color: var(--gray500);
}

.land-name {
  flex: 1;
  color: var(--white);
}

.land-count-down {
  font-size: 10px;
  min-height: 19.2px;
  max-height: 19.2px;
}

.land-status {
  color: var(--gray500);
}

.land-action {
  color: var(--primary100);
  cursor: pointer;
  min-width: 24px;
}

.land-action:hover {
  text-decoration: underline;
  color: var(--primary100)
}

.section-title {
  color: var(--gray500);
  text-align: center;
  padding: 6px;
  background: var(--black100);
  border: 1px solid var(--gray500);
  border-bottom: none;
}

.backpack-list,
.shop-list {
  border: 1px solid var(--gray500);
  padding: 6px;
  max-height: 150px;
  overflow-y: auto;
  margin-bottom: 5px;
}

.backpack-item,
.shop-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed var(--gray500);
}

.backpack-item:last-child,
.shop-item:last-child {
  border-bottom: none;
}

.seed-name,
.item-name {
  color: var(--white);
}

.item-desc {
  color: var(--gray500);
  font-size: 12px;
  margin-left: 10px;
}

.seed-count {
  color: var(--gray500);
}

.buy-btn {
  color: var(--primary100);
  cursor: pointer;
}

.buy-btn:hover {
  text-decoration: underline;
}

.stepper {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--gray500);
  border-radius: 3px;
  overflow: hidden;
  margin-left: 4px;
}

.stepper-btn {
  width: 20px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--black100);
  color: var(--gray500);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  user-select: none;
}

.stepper-btn:hover {
  background: var(--black200);
  color: var(--white);
}

.stepper-input {
  width: 30px;
  height: 18px;
  background: var(--black200);
  color: var(--white);
  border: none;
  border-left: 1px solid var(--gray500);
  border-right: 1px solid var(--gray500);
  text-align: center;
  font-size: 12px;
  outline: none;
}

.stepper-input::-webkit-outer-spin-button,
.stepper-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.stepper-input[type=number] {
  -moz-appearance: textfield;
  appearance: textfield;
}

/* 功能选择区域样式 */
.function-section {
  margin-bottom: 8px;
}

.function-tabs {
  display: flex;
  padding: 3px 6px;
  background: var(--black100);
  border: 1px solid var(--gray500);
  border-bottom: none;
  overflow-x: auto;
  white-space: nowrap;
}

.function-tab {
  color: var(--gray500);
  cursor: pointer;
  padding: 3px;
  margin-right: 3px;
  margin-left: 3px;
  /* min-width: 60px; */
  text-align: center;
  user-select: none;
  flex-shrink: 0;
}

.function-tab.active {
  color: var(--white);
  font-weight: bold;
}

.function-tab:hover {
  color: var(--primary100);
}

.function-list {
  border: 1px solid var(--gray500);
  padding: 10px;
  height: 200px;
  /* 固定高度，避免切换时页面抖动 */
  overflow-y: auto;
}

.function-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed var(--gray500);
}

.function-item-active {
  background: rgba(64, 158, 255, 0.1);
}

/* 空状态提示 */
.empty-tip {
  text-align: center;
  color: var(--gray500);
  padding: 20px 0;
  font-size: 12px;
}


/* 工具项样式 */
.tool-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px dashed var(--gray500);
}

.tool-item:last-child {
  border-bottom: none;
}

.tool-name {
  color: var(--white);
  font-weight: bold;
  min-width: 80px;
}

.tool-desc {
  flex: 1;
  color: var(--gray500);
  font-size: 12px;
  margin-left: 10px;
}

.tool-bar {
  display: flex;
  background: var(--black100);
  border: 1px solid var(--gray500);
  margin-bottom: 8px;
}

.tool-btn {
  color: var(--primary100);
  padding: 5px 10px;
}

.tool-btn:hover {
  /* 鼠标指针样式 */
  cursor: pointer;
}


/* 土地升级样式 */
.upgrade-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px dashed var(--gray500);
  gap: 6px;
}

.upgrade-item:last-child {
  border-bottom: none;
}

/* 配送工具样式 */
.delivery-item {
  padding: 6px;
  border-bottom: 1px dashed var(--gray500);
}

.delivery-item:last-child {
  border-bottom: none;
}

.delivery-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.delivery-name {
  color: var(--white);
}

.delivery-stats {
  font-size: 12px;
  margin-top: 4px;
}

.delivery-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
}

.delivery-price {
  color: var(--white);
}

/* 配送记录样式 */
.delivery-record {
  margin-top: 8px;
  padding-top: 8px;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-info {
  font-size: 12px;
  margin-top: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-time {
  color: var(--primary100);
}




/* 特殊建筑样式 */
.building-item {
  padding: 10px;
  border: 1px solid var(--gray500);
}

.building-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.building-name {
  color: var(--white);
  font-weight: bold;
}

.building-action {
  color: var(--primary100);
  cursor: pointer;
}

.building-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-row {
  font-size: 12px;
}

.upgrade-name {
  color: var(--white);
  min-width: 60px;
}

.upgrade-desc {
  color: var(--gray500);
  font-size: 12px;
  flex: 1;
}

.upgrade-btn {
  color: var(--primary100);
  cursor: pointer;
}

.upgrade-btn:hover {
  text-decoration: underline;
}

/* 农场日志区域样式 */
.log-section {
  padding: 6px;
  border: 1px solid var(--gray500);
  max-height: 160px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  align-items: flex-start;
  padding: 4px 0;
  border-bottom: 1px solid #2a2a2a;
  font-size: 12px;
}

.log-time {
  min-width: 35px;
  color: var(--gray500);
}

/* 消息队列样式 */
.message-queue {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 80%;
  max-width: 320px;
  pointer-events: none;
}

.toast-item {
  background: rgba(0, 0, 0, 0.85);
  color: var(--white);
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  border-left: 3px solid var(--primary100);
}

.toast-info {
  border-left-color: var(--primary100);
}

.toast-success {
  border-left-color: #5ad8a6;
}

.toast-warning {
  border-left-color: #f6bd16;
}

.toast-error {
  border-left-color: #e8684a;
}

/* 动画效果 */
.toast-enter-active {
  animation: toast-in 0.4s ease-out;
}

.toast-leave-active {
  animation: toast-out 0.4s ease-in;
}

@keyframes toast-in {
  0% {
    opacity: 0;
    transform: translateY(50px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes toast-out {
  0% {
    opacity: 1;
    transform: translateY(0);
  }

  100% {
    opacity: 0;
    transform: translateY(-20px);
  }
}


/* 页脚样式 */
.footer {
  text-align: center;
  padding: 6px;
  color: var(--gray500);
  font-size: 12px;
}

/* 配送工具横向浮动样式 */
.delivery-trigger {
  position: relative;
}

.delivery-tools-float {
  position: absolute;
  top: 0;
  right: 100%;
  margin-right: 8px;
  display: flex;
  gap: 6px;
  background: var(--black100);
  border: 1px solid var(--gray500);
  padding: 4px 8px;
  border-radius: 4px;
  z-index: 100;
}

.delivery-tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--white);
  cursor: pointer;
  padding: 6px;
  gap: 2px;
  width: 60px;
}

.delivery-tool-item:hover {
  background: rgba(64, 158, 255, 0.2);
  border-radius: 4px;
}

.float-tip {
  font-size: 10px;
  color: var(--gray500);
}

:deep(.van-notice-bar) {
  height: 24px;
}

.notice-bar {
  width: 100%;
}

.section-tabs {
  min-height: 36px;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 集市任务区域 */
.market-section {
  margin-bottom: 4px;
  min-height: 130px;
}

.market-tasks {
  padding: 4px 0;
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
  min-height: 120px;
}

.market-tasks::-webkit-scrollbar {
  display: none;
}

.task-card {
  flex-shrink: 0;
  width: 130px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--gray500);
  border-radius: 8px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  margin-right: 6px;
}

.task-rewards {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.reward-item {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 4px;
}

.reward-item.exp {
  background: rgba(59, 130, 246, 0.3);
  color: var(--primary100);
}

.reward-item.gold {
  background: rgba(251, 191, 36, 0.3);
  color: #ffd700;
}

.task-items {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-bottom: 6px;
}

.item-box {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: var(--white);
}

.item-box.done {
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid var(--green);
}

.item-box.need {
  background: rgba(255, 255, 255, 0.05);
  border: 1px dashed var(--gray500);
  opacity: 0.5;
}

.check-mark {
  position: absolute;
  bottom: -2px;
  right: -2px;
  color: var(--green);
}

.item-num {
  position: absolute;
  bottom: -8px;
  font-size: 8px;
  color: rgba(255, 255, 255, 0.5);
}

.task-npc {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 6px;
}

.npc-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--white);
}

.npc-label {
  font-size: 10px;
  color: var(--gray500);
  margin-top: 2px;
}

.task-footer {
  display: flex;
  justify-content: center;
}

.submit-btn {
  font-size: 12px;
  padding: 1px 10px;
  border-radius: 6px;
  background: rgba(34, 197, 94, 0.2);
  color: var(--green);
  border: 1px solid var(--green);
  cursor: pointer;
}

.submit-btn:hover {
  background: rgba(34, 197, 94, 0.3);
}

.submit-btn.disabled {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.1);
  cursor: not-allowed;
}

.no-tasks {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 120px;
  color: rgba(255, 255, 255, 0.3);
  font-size: 12px;
  gap: 4px;
}
</style>
