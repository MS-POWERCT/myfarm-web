<template>
  <div class="farm3">
    <header class="hud">
      <div class="hud-user" @click="$router.push('/userSettings/statistics')">
        <div class="hud-avatar">
          <IconifyIcon icon="mdi:sprout" width="22" />
        </div>
        <div class="hud-names">
          <strong>{{ userName }}</strong>
          <em>{{ globalStore.FARM_NAME }}</em>
        </div>
      </div>
      <div class="hud-right">
        <div class="chip" v-for="walletAsset in walletAssets" :key="walletAsset.asset_id">
          <IconifyIcon v-if="walletAsset.asset_id !== 1" icon="ph:gem" width="14" class="gem" />
          {{ walletAsset.balance }}
          <IconifyIcon v-if="walletAsset.asset_id === 1" :icon="globalStore.goldIcon" width="14" />
        </div>
      </div>
    </header>

    <div class="exp-track" :class="{ shine: isLevelingUp }">
      <span>Lv.{{ levelId }} {{ levelTitle }}</span>
      <div class="exp-rail">
        <div class="exp-fill" :style="{ width: (isLevelingUp ? 100 : expProgress) + '%' }"></div>
      </div>
      <span class="exp-num">
        {{ exp }}/{{ nextLevelExp }}
        <IconifyIcon :icon="globalStore.expIcon" width="12" />
      </span>
    </div>

    <section class="orders">
      <div class="orders-label">今日订单</div>
      <div v-if="marketList.length" class="orders-scroller">
        <div
          v-for="item in marketList"
          :key="item.id"
          :class="['order-ticket', { ready: checkTaskRequirements(item) }]"
          @click="tryDeliverTask(item)"
        >

          <div class="order-head">
            <button type="button" class="order-avatar" title="查看任务详情" @click.stop="openTaskDetail(item)">
              <img v-if="npcFace(item)" :src="npcFace(item)" alt="" />
              <IconifyIcon v-else icon="mdi:account-circle" width="28" />
            </button>
            <div class="order-payout">
              <b>{{ item.farm_task.reward_exp }}<IconifyIcon :icon="globalStore.expIcon" width="12" /></b>
              <span>{{ item.farm_task.reward_gold }}<IconifyIcon :icon="globalStore.goldIcon" width="12" /></span>
            </div>
          </div>
          <div class="order-needs">
            <div
              v-for="(status, idx) in getRequirementStatus(item)"
              :key="idx"
              :class="['need', { ok: status.isMet }]"
            >
              <FarmIcon v-if="status.handbook || status.icon" :handbook="status.handbook" :icon="status.icon" :size="16" />
              <i v-if="status.isMet" class="ok-dot"></i>
              <small v-else>{{ status.current }}/{{ status.required }}</small>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="orders-empty">集市暂无订单</div>
    </section>

    <section class="field">
      <div class="field-bar">
        <h2>田地</h2>
        <div class="field-tools">
          <button type="button" @click="init()">刷新</button>
          <button type="button" @click="clearAll()">铲除</button>
          <button type="button" @click="harvestAll()">收获</button>
          <button v-if="isChoiceMode" type="button" class="plant" @click="doPlantAll()">播种</button>
        </div>
      </div>
      <div class="plots">
        <div
          v-for="(land, index) in lands"
          :key="index"
          :class="['plot', `st-${land.status}`, `lv-${land.level_id}`]"
          @click="handleLandClick(land, index)"
        >
          <span class="plot-no">{{ index + 1 }}</span>
          <div class="plot-visual">
            <FarmIcon v-if="land.status === 1 || land.status === 2" :handbook="land.handbook" :size="28" />
            <IconifyIcon v-else-if="land.status === 0" icon="meteocons:pollen-fill" width="26" />
            <IconifyIcon v-else-if="land.status === 3" icon="meteocons:pollen-grass" width="26" />
            <IconifyIcon v-else-if="land.status === 9" icon="fxemoji:lock" width="26" />
          </div>
          <div class="plot-name">{{ landName(land, index) }}</div>
          <div v-if="landMeta(land)" class="plot-meta">{{ landMeta(land) }}</div>
          <div class="plot-state">{{ landStatus(land.status) }}</div>
          <van-count-down
            v-if="land.status === 1"
            :time="getTime(land.plant_mature_at)"
            format="HH:mm:ss"
            class="plot-time"
            @finish="onFinish(land.id)"
          />
        </div>
      </div>
    </section>

    <section class="sheet">
      <div v-if="currentFunction === 'backpack'">
        <p v-if="isChoiceMode" class="sheet-tip">
          已选 <b>{{ selectedHandbookName }}</b>
          <span @click="cancelChoice">取消</span>
        </p>
        <p v-else class="sheet-tip">点选种子，再点空地种植</p>
        <div v-if="seedList.length" class="seed-grid">
          <div
            v-for="seed in seedList"
            :key="seed.name"
            :class="['seed', { on: selectedHandbookId === seed.handbook_id }]"
            @click="doChoice(seed.handbook_id, seed.handbook.name)"
          >
            <FarmIcon :handbook="seed.handbook" :size="22" />
            <b>{{ seed.handbook.name }}</b>
            <em>x{{ seed.num }}</em>
          </div>
        </div>
        <p v-else class="empty">背包空空如也</p>
      </div>

      <div v-else-if="currentFunction === 'shop'">
        <div class="qty">
          购买数量
          <button type="button" @click="decreaseBuyQty">−</button>
          <input v-model.number="globalBuyQuantity" type="number" min="1" />
          <button type="button" @click="increaseBuyQty">+</button>
        </div>
        <div v-if="shops.length" class="shop-rows">
          <div v-for="item in shops" :key="item.id" :class="['shop-row', { lock: !canBuyShopItem(item) }]">
            <div class="shop-face" @click="openShopDetail(item)">
              <FarmIcon :handbook="item.handbook" :size="22" />
            </div>
            <div class="shop-copy" @click="openShopDetail(item)">
              <b>{{ item.handbook.name }}</b>
              <span>
                {{ item.handbook.quarter }}季 · {{ item.handbook.price }}
                <IconifyIcon :icon="globalStore.goldIcon" width="12" />
                · Lv.{{ item.handbook.level_id }}
              </span>
            </div>
            <button v-if="canBuyShopItem(item)" type="button" @click="buy(item)">买</button>
            <em v-else>Lv.{{ item.handbook.level_id }}</em>
          </div>
        </div>
        <p v-else class="empty">暂无商品</p>
      </div>

      <div v-else-if="currentFunction === 'fruit'">
        <p class="sheet-tip">
          仓库 {{ warehouseUse }} / {{ warehouseSize }}
          <span v-if="nextExtendPrice > 0" @click="extendWarehouse">
            扩充 +{{ nextExtendSize }} · {{ nextExtendPrice }}
            <IconifyIcon :icon="globalStore.goldIcon" width="12" />
          </span>
        </p>
        <div v-if="fruitList.length" class="seed-grid">
          <div v-for="fruit in fruitList" :key="fruit.name" class="seed">
            <FarmIcon :handbook="fruit.handbook" :size="22" />
            <b>{{ fruit.handbook.name }}</b>
            <em>x{{ fruit.num }}</em>
            <small>
              {{ fruit.handbook.selling_price }}
              <IconifyIcon
                v-if="!fruit.handbook.selling_asset_name || fruit.handbook.selling_asset_name === '金币'"
                :icon="globalStore.goldIcon"
                width="12"
              />
              <template v-else>{{ fruit.handbook.selling_asset_name }}</template>
            </small>
            <span v-if="isHaveDeliveryTool" class="send" @click.stop="clickDelivery(fruit)">送货</span>
            <div v-if="showDeliveryPopup && selectedFruit?.handbook_id === fruit.handbook_id" class="send-menu">
              <div v-for="tool in availableDeliveryTools" :key="tool.id" @click.stop="selectDeliveryTool(tool)">
                {{ tool.name }}
              </div>
              <div v-if="!availableDeliveryTools.length">无配送工具</div>
            </div>
          </div>
        </div>
        <p v-else class="empty">仓库空空如也</p>
      </div>

      <div v-else-if="currentFunction === 'upgrade'">
        <div v-if="landUpgradeInfo.length" class="up-list">
          <div v-for="upgrade in landUpgradeInfo" :key="upgrade.id" class="up-row">
            <div>
              <b>{{ upgrade.name }}</b>
              <p>{{ upgrade.desc }}</p>
            </div>
            <button type="button" @click="upgradeLand(upgrade)">
              {{ upgrade.bottom }} · {{ upgrade.price }}
              <IconifyIcon :icon="globalStore.goldIcon" width="14" />
            </button>
          </div>
        </div>
        <p v-else class="empty">暂无升级信息</p>
      </div>

      <div v-else-if="currentFunction === 'building'" class="tree-box">
        <IconifyIcon icon="streamline-emojis:christmas-tree" width="56" />
        <h3>世界树</h3>
        <p>每日点击获得祝福</p>
        <button v-if="worldTree.is_click === 0" type="button" @click="clickWorldTree">获得祝福</button>
        <em v-else>今日已祝福</em>
        <ul>
          <li>
            每次 +{{ worldTree.exp }}<IconifyIcon :icon="globalStore.expIcon" width="14" />
            & +{{ worldTree.gold }}<IconifyIcon :icon="globalStore.goldIcon" width="14" />
          </li>
          <li>
            累计 {{ worldTree.total_exp }}<IconifyIcon :icon="globalStore.expIcon" width="14" />
            · {{ worldTree.total_gold }}<IconifyIcon :icon="globalStore.goldIcon" width="14" />
          </li>
          <li>祝福 {{ worldTree.click_count }} 次</li>
        </ul>
      </div>
    </section>

    <nav class="dock">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :class="{ on: currentFunction === tab.key }"
        @click="switchTab(tab.key)"
      >
        <IconifyIcon :icon="tab.icon" width="20" />
        {{ tab.name }}
      </button>
    </nav>

    <div v-if="hasDeliveryingTools.length" class="float-trucks">
      <div v-for="tool in hasDeliveryingTools" :key="tool.id" class="truck">
        <IconifyIcon :icon="tool.icon" width="18" />
        <div>
          <b>{{ tool.name }}</b>
          <span>{{ tool.delivery_record.handbook?.name }} x{{ tool.delivery_record.num }}</span>
          <van-count-down
            v-if="tool.delivery_record.status === 0"
            :time="getDeliveryTime(tool.delivery_record.end_at)"
            format="mm:ss"
            @finish="onDeliveryFinish(tool)"
          />
        </div>
      </div>
    </div>

    <div v-if="showShopDetail" class="mask" @click.self="closeShopDetail">
      <div class="dialog shop-detail">
        <div class="sd-head">
          <FarmIcon v-if="shopDetailItem?.handbook" :handbook="shopDetailItem.handbook" :size="40" />
          <div class="sd-title">
            <h3>{{ shopDetailItem?.handbook?.name }}</h3>
            <span v-if="isShopDetailFruit" class="sd-tag fruit">果实</span>
            <span v-else-if="isShopDetailProduct" class="sd-tag product">产物</span>
          </div>
        </div>
        <p v-if="shopDetailItem?.handbook?.description || shopDetailItem?.handbook?.desc" class="sd-desc">
          {{ shopDetailItem.handbook.description || shopDetailItem.handbook.desc }}
        </p>

        <div class="sd-grid">
          <div class="sd-cell">
            <span>解锁等级</span>
            <b>Lv.{{ shopDetailItem?.handbook?.level_id }}</b>
          </div>
          <div v-if="shopDetailItem?.handbook?.quarter" class="sd-cell">
            <span>生长季数</span>
            <b>{{ shopDetailItem.handbook.quarter }}季</b>
          </div>
          <div v-if="shopDetailMatureTime" class="sd-cell">
            <span>成长时间</span>
            <b>{{ shopDetailMatureTime }}</b>
          </div>
          <div v-if="shopDetailItem?.handbook?.quarter_output_num" class="sd-cell">
            <span>每季产出</span>
            <b>{{ shopDetailItem.handbook.quarter_output_num }}</b>
          </div>
          <div v-if="shopDetailItem?.handbook?.quarter_exp" class="sd-cell">
            <span>收获经验</span>
            <b class="sd-exp">
              +{{ shopDetailItem.handbook.quarter_exp }}
              <IconifyIcon :icon="globalStore.expIcon" width="14" />
            </b>
          </div>
          <div v-if="isShopDetailProduct" class="sd-cell">
            <span>每日限购</span>
            <b>{{ shopDetailDayLimitText }}</b>
          </div>
        </div>

        <div class="sd-prices">
          <div>
            <span>买入</span>
            <b>
              {{ shopDetailItem?.handbook?.price }}
              <IconifyIcon :icon="globalStore.goldIcon" width="14" />
            </b>
          </div>
          <div v-if="shopDetailItem?.handbook?.selling_price">
            <span>卖出</span>
            <b>
              {{ shopDetailItem.handbook.selling_price }}
              <IconifyIcon :icon="globalStore.goldIcon" width="14" />
            </b>
          </div>
        </div>

        <div v-if="isShopDetailFruit && shopExpectedIncome !== null" class="sd-income">
          <div class="sd-income-top">
            <span>预计收入</span>
            <b :class="shopExpectedIncome >= 0 ? 'gain' : 'loss'">
              {{ shopExpectedIncome >= 0 ? '+' : '' }}{{ shopExpectedIncome }}
              <IconifyIcon :icon="globalStore.goldIcon" width="16" />
            </b>
          </div>
          <p>{{ shopExpectedFormula }}</p>
        </div>

        <button type="button" @click="closeShopDetail">关闭</button>
      </div>
    </div>

    <div v-if="showTaskDetail" class="mask" @click.self="closeTaskDetail">
      <div class="dialog task-detail">
        <div class="td-head">
          <div class="td-avatar">
            <img v-if="npcFace(taskDetailItem)" :src="npcFace(taskDetailItem)" alt="" />
            <IconifyIcon v-else icon="mdi:account-circle" width="42" />
          </div>
          <div class="td-title">
            <h3>{{ taskDetailName }}</h3>
            <div class="td-meta">
              <span v-if="taskDetailNpc">委托人 · {{ taskDetailNpc }}</span>
              <em :class="['td-rare', taskDetailRarity.key]">{{ taskDetailRarity.label }}</em>
            </div>
          </div>
        </div>
        <p v-if="taskDetailDesc" class="td-desc">{{ taskDetailDesc }}</p>

        <div class="td-section">需求进度</div>
        <div v-if="taskDetailNeeds.length" class="td-needs">
          <div v-for="need in taskDetailNeeds" :key="need.handbook_id" class="td-need">
            <FarmIcon :handbook="need.handbook" :icon="need.icon" :size="28" />
            <div class="td-need-copy">
              <div class="td-need-top">
                <b>{{ need.handbook?.name || '货物' }}</b>
                <span :class="{ ok: need.isMet }">{{ need.current }}/{{ need.required }}</span>
              </div>
              <div class="td-bar">
                <i :style="{ width: needProgress(need) + '%' }" :class="{ ok: need.isMet }"></i>
              </div>
            </div>
          </div>
        </div>
        <p v-else class="td-empty">暂无需求</p>

        <div class="td-section">奖励</div>
        <div class="td-rewards">
          <div>
            <span>经验</span>
            <b>
              +{{ taskDetailItem?.farm_task?.reward_exp || 0 }}
              <IconifyIcon :icon="globalStore.expIcon" width="14" />
            </b>
          </div>
          <div>
            <span>金币</span>
            <b>
              +{{ taskDetailItem?.farm_task?.reward_gold || 0 }}
              <IconifyIcon :icon="globalStore.goldIcon" width="14" />
            </b>
          </div>
        </div>

        <button
          v-if="taskDetailReady"
          type="button"
          class="td-submit"
          @click="submitTaskFromDetail"
        >交付任务</button>
        <p v-else class="td-wait">货物不足，暂时无法交付</p>
        <button type="button" class="td-close" @click="closeTaskDetail">关闭</button>
      </div>
    </div>

    <div v-if="showNoticePopup" class="mask" @click.self="dismissNotice">
      <div class="dialog">
        <h3>公告</h3>
        <p>{{ notice }}</p>
        <button type="button" @click="dismissNotice">知道了</button>
      </div>
    </div>

    <div v-if="isLevelingUp" class="levelup">
      <div class="banner">🎉 升级啦！Lv.{{ levelId }} 🎉</div>
      <span v-for="p in levelupParticles" :key="p.id" class="spark" :style="p.style">{{ p.emoji }}</span>
    </div>

    <div class="toasts">
      <transition-group name="toast">
        <div
          v-for="msg in messages"
          :key="msg.id"
          :class="['toast', msg.type, { leaving: !msg.visible }]"
        >
          <span>{{ msg.text }}</span>
          <IconifyIcon v-if="msg.icon" :icon="msg.icon" width="14" />
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useGlobalStore } from '@/stores/global'
import { useFarmStore } from '@/stores/farm'
import FarmIcon from '@/components/FarmIcon.vue'
import { npcIconSrc } from '@/utils/farmIcon'

const globalStore = useGlobalStore()
const farmStore = useFarmStore()

const notice = ref('【公告】欢迎来到纯文字农场，每日签到世界树可获得丰富奖励，集市任务奖励丰厚哦')
const NOTICE_DATE_KEY = 'farm_v3_notice_shown_date'
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

const STORAGE_KEY = 'farm_v3_active_tab'
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

const shopItemType = (item) => item?.type || item?.handbook?.type || ''
const isShopDetailProduct = computed(() => shopItemType(shopDetailItem.value) === 'product')
const isShopDetailFruit = computed(() => shopItemType(shopDetailItem.value) === 'fruit')

const formatMatureTime = (value) => {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return ''
  const h = Math.floor(n / 3600)
  const m = Math.floor((n % 3600) / 60)
  const s = Math.floor(n % 60)
  const parts = []
  if (h) parts.push(`${h}小时`)
  if (m) parts.push(`${m}分`)
  if (s || !parts.length) parts.push(`${s}秒`)
  return parts.join('')
}

const shopDetailMatureTime = computed(() =>
  formatMatureTime(shopDetailItem.value?.handbook?.mature_time)
)

const shopDetailDayLimitText = computed(() => {
  const limit = shopDetailItem.value?.day_limit ?? shopDetailItem.value?.handbook?.day_limit
  if (limit === null || limit === undefined || limit === '') return '不限'
  const n = Number(limit)
  if (!Number.isFinite(n) || n <= 0) return '不限'
  return `${n} 个`
})

const shopExpectedIncome = computed(() => {
  if (!isShopDetailFruit.value) return null
  const h = shopDetailItem.value?.handbook
  if (!h) return null
  const quarters = Number(h.quarter) || 0
  const output = Number(h.quarter_output_num) || 0
  const sell = Number(h.selling_price) || 0
  const buy = Number(h.price) || 0
  if (!quarters && !output && !sell) return null
  return quarters * output * sell - buy
})

const shopExpectedFormula = computed(() => {
  const h = shopDetailItem.value?.handbook
  if (!h) return ''
  return `${Number(h.quarter) || 0}季 × ${Number(h.quarter_output_num) || 0} × ${Number(h.selling_price) || 0} − ${Number(h.price) || 0}`
})

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
  showToast({ message: `${actionName}+${expValue}`, type: 'success' })
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
      handbook: handbook || fruit?.handbook || null,
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

const showTaskDetail = ref(false)
const taskDetailItem = ref(null)

const openTaskDetail = (item) => {
  taskDetailItem.value = item
  showTaskDetail.value = true
}

const closeTaskDetail = () => {
  showTaskDetail.value = false
  taskDetailItem.value = null
}

const taskDetailName = computed(() => {
  const t = taskDetailItem.value?.farm_task
  return t?.name || t?.title || t?.task_name || t?.npc_name || '集市订单'
})

const taskDetailNpc = computed(() => {
  const t = taskDetailItem.value?.farm_task
  const npc = t?.npc
  return t?.npc_name || npc?.name || npc?.title || ''
})

const npcFace = (item) => npcIconSrc(item?.farm_task?.npc)

const taskDetailDesc = computed(() => {
  const t = taskDetailItem.value?.farm_task
  return t?.description || t?.desc || t?.content || ''
})

const taskDetailRarity = computed(() => {
  const raw = taskDetailItem.value?.farm_task?.rarity
    ?? taskDetailItem.value?.farm_task?.quality
    ?? taskDetailItem.value?.farm_task?.rare
    ?? taskDetailItem.value?.farm_task?.star
  const map = {
    0: { label: '普通', key: 'normal' },
    1: { label: '普通', key: 'normal' },
    2: { label: '稀有', key: 'rare' },
    3: { label: '史诗', key: 'epic' },
    4: { label: '传说', key: 'legendary' },
    normal: { label: '普通', key: 'normal' },
    common: { label: '普通', key: 'normal' },
    rare: { label: '稀有', key: 'rare' },
    epic: { label: '史诗', key: 'epic' },
    legendary: { label: '传说', key: 'legendary' },
  }
  const n = Number(raw)
  if (Number.isFinite(n) && map[n]) return map[n]
  return map[String(raw || '').toLowerCase()] || { label: '普通', key: 'normal' }
})

const taskDetailNeeds = computed(() =>
  taskDetailItem.value ? getRequirementStatus(taskDetailItem.value) : []
)

const taskDetailReady = computed(() =>
  taskDetailItem.value ? checkTaskRequirements(taskDetailItem.value) : false
)

const needProgress = (need) => {
  if (!need.required) return 0
  return Math.min(100, Math.round((need.current / need.required) * 100))
}

const submitTaskFromDetail = async () => {
  const task = taskDetailItem.value
  if (!task) return
  closeTaskDetail()
  await tryDeliverTask(task)
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
    await farmStore.fetchWarehouseList('fruit')
    const totalExp = growingLands.reduce((acc, land) => acc + land.handbook.quarter_exp, 0)
    await addExp(totalExp, `收获${growingLands.length}块土地`)
    showToast({ message: `一键收获成功，获得${totalExp}`, type: 'success' })
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
.farm3 {
  min-height: 100vh;
  padding: 12px 14px 88px;
  padding-top: calc(12px + env(safe-area-inset-top));
  color: #f3ead8;
  background:
    radial-gradient(1200px 500px at 20% -10%, rgba(124, 179, 66, 0.18), transparent 55%),
    linear-gradient(180deg, #1b2616 0%, #2a2216 48%, #1a140e 100%);
}

.hud {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.hud-user {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  cursor: pointer;
}

.hud-avatar {
  position: relative;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  background: #3d5a2b;
  color: #b6e388;
}

.hud-lv {
  position: absolute;
  right: -6px;
  bottom: -6px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: #e8c547;
  color: #3a2a08;
  font-size: 10px;
  font-weight: 800;
  display: grid;
  place-items: center;
}

.hud-lv.pop {
  animation: pop 0.7s ease;
}

.hud-names {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.hud-names strong {
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hud-names em {
  font-style: normal;
  font-size: 11px;
  color: rgba(243, 234, 216, 0.55);
}

.hud-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.28);
  font-size: 12px;
  font-weight: 700;
}

.gold { color: #e8c547; }
.gem { color: #7ad7ff; }

.exp-track {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0 14px;
  font-size: 11px;
  color: rgba(243, 234, 216, 0.6);
}

.exp-num {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  white-space: nowrap;
}

.exp-rail {
  flex: 1;
  height: 6px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.exp-fill {
  height: 100%;
  background: linear-gradient(90deg, #7cb342, #e8c547);
  transition: width 0.4s ease;
}

.exp-track.shine .exp-fill {
  background: linear-gradient(90deg, #e8c547, #ff8a00, #e8c547);
  background-size: 200% 100%;
  animation: shine 0.8s linear infinite;
}

.orders-label, .field-bar h2 {
  margin: 0;
  font-size: 13px;
  letter-spacing: 0.08em;
  color: #c5de9d;
}

.orders-scroller {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 8px 0 4px;
}

.order-ticket {
  min-width: 118px;
  border: 1px solid rgba(232, 197, 71, 0.18);
  border-radius: 14px;
  padding: 8px;
  background: rgba(20, 28, 16, 0.55);
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.order-avatar {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  border-radius: 50%;
  line-height: 0;
  overflow: hidden;
  width: 40px;
  height: 40px;
}

.order-avatar img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  display: block;
}

.order-avatar:hover {
  color: #e8c547;
}

.order-ticket.ready {
  border-color: #e8c547;
  box-shadow: 0 0 16px rgba(232, 197, 71, 0.35);
}

.order-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-payout {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 10px;
}

.order-payout b,
.order-payout span {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.order-payout b { color: #e8c547; }
.order-payout span { color: #f0d27a; }

.order-needs {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
}

.need {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.06);
  border: 1px dashed rgba(255, 255, 255, 0.2);
}

.need.ok {
  border: 1px solid #7cb342;
  background: rgba(124, 179, 66, 0.18);
}

.need small, .ok-dot {
  position: absolute;
  bottom: -7px;
  font-size: 8px;
  color: rgba(243, 234, 216, 0.6);
}

.ok-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #7cb342;
  right: -2px;
  bottom: -2px;
}

.orders-empty {
  margin-top: 8px;
  font-size: 12px;
  color: rgba(243, 234, 216, 0.4);
}

.field {
  margin-top: 8px;
}

.field-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field-tools {
  display: flex;
  gap: 6px;
}

.field-tools button {
  border: 0;
  border-radius: 999px;
  padding: 5px 9px;
  background: rgba(255, 255, 255, 0.08);
  color: #f3ead8;
  font-size: 11px;
}

.field-tools .plant {
  background: #7cb342;
  color: #14200c;
  font-weight: 700;
}

.plots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 10px;
}

.plot {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border-radius: 16px;
  padding: 12px 8px 10px;
  text-align: center;
  background: #3a2a1c;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.plot.st-0 { background: linear-gradient(180deg, #5b4330, #3d2c1e); }
.plot.st-1 { background: linear-gradient(180deg, #3d5a2b, #24361b); }
.plot.st-2 {
  background: linear-gradient(180deg, #6b5a22, #3d3414);
  box-shadow: 0 0 12px rgba(232, 197, 71, 0.28);
}
.plot.st-3 { background: linear-gradient(180deg, #4a433c, #2c2722); color: #cbbba4; }
.plot.st-9 { background: #1e1c18; opacity: 0.72; }

.plot-no {
  position: absolute;
  top: 6px;
  left: 8px;
  font-size: 10px;
  opacity: 0.45;
}

.plot-visual {
  height: 36px;
  display: grid;
  place-items: center;
}

.plot-name {
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plot-meta, .plot-state, .plot-time {
  font-size: 10px;
  color: rgba(243, 234, 216, 0.62);
}

.plot-time { color: #b6e388; }

.sheet {
  margin-top: 16px;
  padding: 12px;
  border-radius: 18px;
  background: rgba(14, 18, 12, 0.62);
  border: 1px solid rgba(197, 222, 157, 0.12);
}

.sheet-tip {
  margin: 0 0 10px;
  font-size: 12px;
  color: rgba(243, 234, 216, 0.6);
}

.sheet-tip span, .sheet-tip b + span {
  margin-left: 8px;
  color: #e8c547;
  cursor: pointer;
}

.seed-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.seed {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  font-size: 11px;
}

.seed.on {
  outline: 1px solid #7cb342;
  background: rgba(124, 179, 66, 0.16);
}

.seed b {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.seed em { color: #e8c547; font-style: normal; }
.seed small {
  color: rgba(243, 234, 216, 0.45);
  font-size: 9px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.send {
  color: #7ad7ff;
  font-size: 10px;
}

.send-menu {
  position: absolute;
  bottom: 100%;
  z-index: 5;
  min-width: 90px;
  padding: 6px;
  border-radius: 8px;
  background: #14180f;
}

.qty {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 12px;
}

.qty button, .qty input {
  width: 32px;
  height: 28px;
  border: 0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: #f3ead8;
  text-align: center;
}

.shop-rows, .up-list { display: flex; flex-direction: column; gap: 8px; }

.shop-row, .up-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
}

.shop-row.lock { opacity: 0.5; }

.shop-face {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.2);
}

.shop-copy { flex: 1; min-width: 0; }
.shop-copy b { display: block; font-size: 13px; }
.shop-copy span {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: rgba(243, 234, 216, 0.5);
}

.shop-row button, .up-row button, .tree-box button, .dialog button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 0;
  border-radius: 999px;
  padding: 7px 12px;
  background: #7cb342;
  color: #14200c;
  font-weight: 700;
}

.up-row p {
  margin: 4px 0 0;
  font-size: 11px;
  color: rgba(243, 234, 216, 0.5);
}

.tree-box { text-align: center; }
.tree-box p, .tree-box ul { color: rgba(243, 234, 216, 0.6); font-size: 12px; }
.tree-box ul { padding: 0; list-style: none; }
.tree-box li {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin: 6px 0;
}

.empty {
  text-align: center;
  color: rgba(243, 234, 216, 0.4);
  padding: 20px 0;
}

.dock {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: calc(10px + env(safe-area-inset-bottom));
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  padding: 8px 6px;
  border-radius: 18px;
  background: rgba(16, 20, 12, 0.92);
  border: 1px solid rgba(197, 222, 157, 0.16);
  z-index: 40;
}

.dock button {
  border: 0;
  background: transparent;
  color: rgba(243, 234, 216, 0.5);
  font-size: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.dock button.on { color: #e8c547; }

.float-trucks {
  position: fixed;
  left: 12px;
  bottom: 86px;
  z-index: 30;
}

.truck {
  display: flex;
  gap: 8px;
  padding: 8px;
  margin-top: 6px;
  border-radius: 12px;
  background: rgba(16, 20, 12, 0.9);
  font-size: 11px;
}

.mask {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(0, 0, 0, 0.5);
  display: grid;
  place-items: center;
  padding: 24px;
}

.dialog {
  width: 100%;
  max-width: 320px;
  padding: 18px;
  border-radius: 18px;
  background: #24301c;
}

.dialog h3 { margin: 0 0 10px; display: flex; align-items: center; gap: 8px; }
.dialog p { color: rgba(243, 234, 216, 0.7); font-size: 13px; line-height: 1.5; }
.dialog dl { margin: 0 0 14px; }
.dialog dl div { display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin: 8px 0; }
.dialog dt { color: rgba(243, 234, 216, 0.5); }
.dialog dd {
  margin: 0;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.dialog button { width: 100%; }

.shop-detail {
  max-width: 340px;
  padding: 16px;
  border: 1px solid rgba(232, 197, 71, 0.16);
}

.sd-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.sd-title h3 {
  margin: 0 0 4px;
  font-size: 16px;
}

.sd-tag {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
}

.sd-tag.fruit {
  background: rgba(124, 179, 66, 0.22);
  color: #b6e388;
}

.sd-tag.product {
  background: rgba(232, 197, 71, 0.18);
  color: #e8c547;
}

.sd-desc {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.5;
  color: rgba(243, 234, 216, 0.58);
}

.sd-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 10px;
}

.sd-cell {
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.22);
}

.sd-cell span {
  display: block;
  font-size: 10px;
  color: rgba(243, 234, 216, 0.45);
  margin-bottom: 4px;
}

.sd-cell b {
  font-size: 13px;
  font-weight: 700;
}

.sd-exp {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.sd-prices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 10px;
}

.sd-prices > div {
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(232, 197, 71, 0.08);
  border: 1px solid rgba(232, 197, 71, 0.12);
}

.sd-prices span {
  display: block;
  font-size: 10px;
  color: rgba(243, 234, 216, 0.45);
  margin-bottom: 4px;
}

.sd-prices b {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.sd-income {
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(124, 179, 66, 0.12);
  border: 1px solid rgba(124, 179, 66, 0.22);
}

.sd-income-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.sd-income-top span {
  font-size: 12px;
  color: rgba(243, 234, 216, 0.55);
}

.sd-income-top b {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 18px;
}

.sd-income-top b.gain { color: #b6e388; }
.sd-income-top b.loss { color: #f87171; }

.sd-income p {
  margin: 6px 0 0;
  font-size: 11px;
  color: rgba(243, 234, 216, 0.4);
}

.task-detail {
  max-width: 340px;
  border: 1px solid rgba(232, 197, 71, 0.16);
}

.td-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.td-avatar {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  background: rgba(124, 179, 66, 0.16);
  color: #c5de9d;
  overflow: hidden;
}

.td-avatar img {
  width: 42px;
  height: 42px;
  object-fit: contain;
}

.td-title h3 {
  margin: 0 0 4px;
  font-size: 16px;
}

.td-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(243, 234, 216, 0.55);
}

.td-rare {
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-style: normal;
  font-weight: 700;
}

.td-rare.normal { background: rgba(255,255,255,0.08); color: rgba(243,234,216,0.7); }
.td-rare.rare { background: rgba(96,165,250,0.18); color: #7ad7ff; }
.td-rare.epic { background: rgba(167,139,250,0.2); color: #c4b5fd; }
.td-rare.legendary { background: rgba(232,197,71,0.2); color: #e8c547; }

.td-desc {
  margin: 0 0 12px;
  font-size: 12px;
  color: rgba(243, 234, 216, 0.58);
}

.td-section {
  font-size: 11px;
  color: #c5de9d;
  letter-spacing: 0.06em;
  margin: 0 0 8px;
}

.td-needs {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.td-need {
  display: flex;
  align-items: center;
  gap: 10px;
}

.td-need-copy { flex: 1; min-width: 0; }

.td-need-top {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
}

.td-need-top span { color: rgba(243, 234, 216, 0.5); }
.td-need-top span.ok { color: #b6e388; }

.td-bar {
  height: 6px;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.td-bar i {
  display: block;
  height: 100%;
  background: #e8c547;
}

.td-bar i.ok { background: #7cb342; }

.td-empty {
  margin: 0 0 12px;
  font-size: 12px;
  color: rgba(243, 234, 216, 0.4);
}

.td-rewards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.td-rewards > div {
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.22);
}

.td-rewards span {
  display: block;
  font-size: 10px;
  color: rgba(243, 234, 216, 0.45);
  margin-bottom: 4px;
}

.td-rewards b {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}

.td-submit {
  margin-bottom: 8px;
  background: #7cb342 !important;
}

.td-wait {
  margin: 0 0 8px;
  text-align: center;
  font-size: 12px;
  color: #e8c547;
}

.td-close {
  background: rgba(255, 255, 255, 0.08) !important;
  color: #f3ead8 !important;
}

.levelup {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 90;
}

.banner {
  position: absolute;
  top: 18%;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 16px;
  border-radius: 999px;
  background: rgba(232, 197, 71, 0.2);
  border: 1px solid #e8c547;
  color: #e8c547;
  font-weight: 800;
}

.spark {
  position: absolute;
  animation: burst 1.4s ease-out forwards;
}

.toasts {
  position: fixed;
  right: 12px;
  bottom: calc(76px + env(safe-area-inset-bottom));
  left: auto;
  top: auto;
  transform: none;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  max-width: min(240px, calc(100vw - 24px));
  pointer-events: none;
}

.toast {
  margin-top: 6px;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(16, 20, 12, 0.92);
  font-size: 12px;
  text-align: right;
}

.toast.success { color: #b6e388; }
.toast.error { color: #f87171; }
.toast.warning { color: #e8c547; }

@keyframes pop {
  40% { transform: scale(1.4); }
}

@keyframes shine {
  to { background-position: 200% 0; }
}

@keyframes burst {
  from { opacity: 1; transform: translate(0, 0) scale(0.5); }
  to { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1.1); }
}

.toast-enter-active, .toast-leave-active { transition: all 0.25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateX(12px); }
</style>
