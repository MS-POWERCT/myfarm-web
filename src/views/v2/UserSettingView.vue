<template>
  <div class="settings-view">
    <div class="top-nav">
      <div class="nav-back" @click="$router.go(-1)">
        <IconifyIcon icon="mdi:chevron-left" width="22" />
      </div>
      <span class="nav-center">设置</span>
      <span class="nav-placeholder"></span>
    </div>

    <div class="settings-content">
      <div class="section">
        <div class="section-title">账户安全</div>
        <div class="section-body">
          <div class="setting-item" @click="showEmailPopup = true">
            <div class="item-icon email">
              <IconifyIcon icon="mdi:email-outline" width="20" />
            </div>
            <div class="item-text">
              <span class="item-label">邮箱</span>
              <span class="item-info">{{ user?.email ? '已绑定邮箱' : '绑定邮箱以提升账户安全性' }}</span>
            </div>
            <span v-if="user?.email" class="item-value">{{ user?.email }}</span>
            <span v-else class="item-action">绑定</span>
            <IconifyIcon icon="mdi:chevron-right" width="16" class="item-arrow" />
          </div>

          <div class="setting-item" :class="{ 'is-disabled': !user?.email }" @click="handlePasswordClick">
            <div class="item-icon password">
              <IconifyIcon icon="mdi:lock-outline" width="20" />
            </div>
            <div class="item-text">
              <span class="item-label">密码</span>
              <span class="item-info">{{ user?.has_password ? '密码强度：强' : '设置密码保护账户' }}</span>
            </div>
            <span v-if="user?.has_password" class="item-value">已设置</span>
            <span v-else-if="user?.email" class="item-action">设置</span>
            <span v-else class="item-disabled">请先绑定邮箱</span>
            <IconifyIcon icon="mdi:chevron-right" width="16" class="item-arrow" />
          </div>

          <div class="setting-item" @click="showWeb3Popup = true">
            <div class="item-icon wallet">
              <IconifyIcon icon="mdi:wallet-outline" width="20" />
            </div>
            <div class="item-text">
              <span class="item-label">Web3钱包</span>
              <span class="item-info">{{ user?.address ? '已绑定钱包地址' : '绑定钱包享受Web3服务' }}</span>
            </div>
            <span v-if="user?.address" class="item-value">{{ formatAddress(user?.address) }}</span>
            <span v-else class="item-action">绑定</span>
            <IconifyIcon icon="mdi:chevron-right" width="16" class="item-arrow" />
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">其他</div>
        <UiVersionSwitch />
        <button class="logout-btn" @click="handleLogout">
          <IconifyIcon icon="basil:logout-solid" width="18" />
          退出登录
        </button>
      </div>

      <div class="version-line">版本 {{ globalStore.APP_VERSION }}</div>
    </div>

    <div v-if="showEmailPopup" class="popup-overlay" @click.self="showEmailPopup = false">
      <div class="popup-box">
        <div class="popup-header">
          <span class="popup-title">绑定邮箱</span>
          <span class="popup-close" @click="showEmailPopup = false">
            <IconifyIcon icon="mdi:close" width="18" />
          </span>
        </div>
        <div class="popup-body">
          <div class="popup-desc">绑定邮箱后可用于找回密码、接收重要通知</div>
          <div class="field-row">
            <span class="field-label">邮箱地址</span>
            <input type="text" v-model="emailForm.email" placeholder="请输入邮箱地址" class="field-input" />
          </div>
          <div class="field-row">
            <span class="field-label">验证码</span>
            <input type="text" v-model="emailForm.code" placeholder="请输入验证码" class="field-input" />
            <span :class="{ 'is-disabled': emailCountdown > 0 || !emailForm.email }" @click="sendEmailCode"
              class="code-btn">
              {{ emailCountdown > 0 ? `${emailCountdown}s` : '发送' }}
            </span>
          </div>
        </div>
        <div class="popup-footer">
          <button class="submit-btn" @click="handleBindEmail">{{ emailLoading ? '绑定中...' : '确认绑定' }}</button>
        </div>
      </div>
    </div>

    <div v-if="showPasswordPopup" class="popup-overlay" @click.self="showPasswordPopup = false">
      <div class="popup-box">
        <div class="popup-header">
          <span class="popup-title">设置密码</span>
          <span class="popup-close" @click="showPasswordPopup = false">
            <IconifyIcon icon="mdi:close" width="18" />
          </span>
        </div>
        <div class="popup-body">
          <div class="popup-desc">{{ user?.email }} 将收到验证码</div>
          <div class="field-row">
            <span class="field-label">验证码</span>
            <input type="text" v-model="passwordForm.code" placeholder="请输入验证码" class="field-input" />
            <span :class="{ 'is-disabled': passwordCountdown > 0 }" @click="sendPasswordCode" class="code-btn">
              {{ passwordCountdown > 0 ? `${passwordCountdown}s` : '发送' }}
            </span>
          </div>
          <div class="field-row">
            <span class="field-label">新密码</span>
            <input type="password" v-model="passwordForm.password" placeholder="请输入6位以上密码" class="field-input" />
          </div>
          <div class="field-row">
            <span class="field-label">确认密码</span>
            <input type="password" v-model="passwordForm.password_confirmation" placeholder="请再次输入密码"
              class="field-input" />
          </div>
        </div>
        <div class="popup-footer">
          <button class="submit-btn" @click="handleSetPassword">{{ passwordLoading ? '设置中...' : '确认设置' }}</button>
        </div>
      </div>
    </div>

    <div v-if="showWeb3Popup" class="popup-overlay" @click.self="showWeb3Popup = false">
      <div class="popup-box">
        <div class="popup-header">
          <span class="popup-title">绑定Web3钱包</span>
          <span class="popup-close" @click="showWeb3Popup = false">
            <IconifyIcon icon="mdi:close" width="18" />
          </span>
        </div>
        <div class="popup-body">
          <div v-if="!web3Address" class="web3-connect">
            <div class="web3-desc">使用 Web3 钱包进行身份验证</div>
            <div class="web3-hint">连接您的钱包即可完成绑定</div>
            <button class="submit-btn" @click="handleConnectWallet">{{ web3Connecting ? '连接中...' : '连接钱包' }}</button>
          </div>
          <div v-else class="web3-connected">
            <div class="wallet-name">{{ web3WalletName }}</div>
            <div class="wallet-address">{{ web3Address }}</div>
            <button class="submit-btn" @click="handleBindWeb3">{{ web3Binding ? '绑定中...' : '确认绑定' }}</button>
            <span class="change-btn" @click="handleDisconnectWallet">更换钱包</span>
          </div>
        </div>
        <div v-if="web3Error" class="popup-error">{{ web3Error }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showFailToast } from 'vant'
import { useUserStore } from '@/stores/user'
import { useGlobalStore } from '@/stores/global'
import { userApi } from '@/api/user'
import { globalApi } from '@/api/global'
import { connectWallet, getCurrentAccount, signMessage, formatAddress } from '@/utils/web3'
import UiVersionSwitch from '@/components/UiVersionSwitch.vue'

const userStore = useUserStore()
const globalStore = useGlobalStore()
const router = useRouter()
const user = computed(() => userStore.user)

const showEmailPopup = ref(false)
const showPasswordPopup = ref(false)
const showWeb3Popup = ref(false)

const emailForm = ref({ email: '', code: '' })
const emailCountdown = ref(0)
const emailLoading = ref(false)

async function sendEmailCode() {
  if (!emailForm.value.email) {
    showFailToast('请输入邮箱地址')
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForm.value.email)) {
    showFailToast('请输入正确的邮箱格式')
    return
  }

  try {
    await globalApi.sendCode({ email: emailForm.value.email, category: 'bind_email' })
    showToast({ message: '验证码已发送', position: 'bottom' })
    emailCountdown.value = globalStore.initData.llconfig.EMAIL_CODE_TIME
    const timer = setInterval(() => {
      emailCountdown.value--
      if (emailCountdown.value <= 0) clearInterval(timer)
    }, 1000)
  } catch (error) {
    showFailToast(error || '发送验证码失败')
  }
}

async function handleBindEmail() {
  if (!emailForm.value.email) { showFailToast('请输入邮箱地址'); return }
  if (!emailForm.value.code) { showFailToast('请输入验证码'); return }

  emailLoading.value = true
  try {
    await userApi.bindEmail({ email: emailForm.value.email, code: emailForm.value.code })
    showToast({ message: '邮箱绑定成功', position: 'bottom' })
    await userStore.getUserInfo()
    showEmailPopup.value = false
    emailForm.value = { email: '', code: '' }
  } catch (error) {
    showFailToast(error.message || '邮箱绑定失败')
  } finally {
    emailLoading.value = false
  }
}

const handlePasswordClick = () => {
  if (user.value?.email) {
    showPasswordPopup.value = true
  }
}

const passwordForm = ref({ code: '', password: '', password_confirmation: '' })
const passwordCountdown = ref(0)
const passwordLoading = ref(false)

async function sendPasswordCode() {
  passwordCountdown.value = globalStore.initData.llconfig.EMAIL_CODE_TIME
  try {
    await globalApi.sendCode({ email: user.value.email, category: 'recover' })
    showToast({ message: '验证码已发送', position: 'bottom' })
    const timer = setInterval(() => {
      passwordCountdown.value--
      if (passwordCountdown.value <= 0) clearInterval(timer)
    }, 1000)
  } catch (error) {
    passwordCountdown.value = 0
    showFailToast(error || '发送验证码失败')
  }
}

async function handleSetPassword() {
  if (!passwordForm.value.code) { showFailToast('请输入验证码'); return }
  if (!passwordForm.value.password) { showFailToast('请输入新密码'); return }
  if (passwordForm.value.password.length < 6) { showFailToast('密码长度不能少于6位'); return }
  if (passwordForm.value.password !== passwordForm.value.password_confirmation) { showFailToast('两次输入的密码不一致'); return }

  passwordLoading.value = true
  try {
    await userApi.setPassword({ ...passwordForm.value })
    showToast({ message: '密码设置成功', position: 'bottom' })
    await userStore.getUserInfo()
    showPasswordPopup.value = false
    passwordForm.value = { code: '', password: '', password_confirmation: '' }
  } catch (error) {
    showFailToast(error.message || '密码设置失败')
  } finally {
    passwordLoading.value = false
  }
}

const web3Address = ref('')
const web3WalletName = ref('')
const web3Connecting = ref(false)
const web3Binding = ref(false)
const web3Error = ref('')

async function handleConnectWallet() {
  web3Error.value = ''
  web3Connecting.value = true
  try {
    const result = await connectWallet()
    web3Address.value = formatAddress(result.address)
    web3WalletName.value = result.wallet
    showToast({ message: '钱包连接成功', position: 'bottom' })
  } catch (error) {
    web3Error.value = error.message?.includes('用户拒绝') ? '用户取消了连接' : (error.message || '钱包连接失败')
  } finally {
    web3Connecting.value = false
  }
}

async function handleBindWeb3() {
  web3Error.value = ''
  web3Binding.value = true
  try {
    const fullAddress = await getCurrentAccount()
    if (!fullAddress) throw new Error('请先连接钱包')

    await userStore.web3Sign()
    const nonce = userStore.web3_nonce
    const message = `Self Youth Bind\n\nAddress: ${fullAddress}\nNonce: ${nonce}`
    const signature = await signMessage(message)

    await userApi.bindAddress({ address: fullAddress, signature, nonce })
    showToast({ message: '地址绑定成功', position: 'bottom' })
    await userStore.getUserInfo()
    showWeb3Popup.value = false
    web3Address.value = ''
    web3WalletName.value = ''
  } catch (error) {
    web3Error.value = error.message?.includes('用户拒绝') ? '用户取消了签名' : (error.message || '地址绑定失败')
  } finally {
    web3Binding.value = false
  }
}

function handleDisconnectWallet() {
  web3Address.value = ''
  web3WalletName.value = ''
  web3Error.value = ''
}

const handleLogout = async () => {
  await userStore.logout()
  router.push('/login')
}

onMounted(() => {
  userStore.getUserInfo()
})
</script>

<style scoped>
.settings-view {
  min-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: #fff;
  font-size: 13px;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  padding-top: calc(12px + env(safe-area-inset-top));
}

.nav-back,
.nav-placeholder {
  width: 36px;
  height: 36px;
}

.nav-back {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  cursor: pointer;
}

.nav-center {
  font-size: 16px;
  font-weight: 600;
}

.settings-content {
  padding: 4px 16px 24px;
}

.section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.55);
  margin-bottom: 10px;
  padding-left: 2px;
}

.section-body {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  overflow: hidden;
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 14px 12px;
  gap: 10px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.setting-item.is-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.item-icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.item-icon.email {
  background: rgba(96, 165, 250, 0.18);
  color: #60a5fa;
}

.item-icon.password {
  background: rgba(167, 139, 250, 0.18);
  color: #a78bfa;
}

.item-icon.wallet {
  background: rgba(74, 222, 128, 0.18);
  color: #4ade80;
}

.item-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-label {
  font-size: 14px;
  font-weight: 600;
}

.item-info {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.45);
}

.item-value {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  max-width: 42%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-action {
  font-size: 12px;
  color: #00d4ff;
  flex-shrink: 0;
}

.item-disabled {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

.item-arrow {
  color: rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}

.logout-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border: 1px solid rgba(248, 113, 113, 0.35);
  border-radius: 14px;
  background: rgba(248, 113, 113, 0.12);
  color: #f87171;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.version-line {
  text-align: center;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  padding: 8px 0 16px;
}

.popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.popup-box {
  width: 100%;
  max-width: 340px;
  background: linear-gradient(180deg, #1f2a44 0%, #16213e 100%);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 16px 18px;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.popup-title {
  font-weight: 600;
  font-size: 16px;
}

.popup-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.7);
}

.popup-body {
  padding: 4px 0;
}

.popup-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 14px;
  line-height: 1.5;
}

.field-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}

.field-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
  width: 64px;
  flex-shrink: 0;
}

.field-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  font-size: 13px;
  outline: none;
  padding: 8px 10px;
  min-width: 0;
}

.field-input::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.field-input:-webkit-autofill,
.field-input:-webkit-autofill:hover,
.field-input:-webkit-autofill:focus,
.field-input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 100px #1f2a44 inset;
  -webkit-text-fill-color: #fff;
  transition: background-color 5000s ease-in-out 0s;
}

.code-btn {
  color: #00d4ff;
  cursor: pointer;
  font-size: 12px;
  flex-shrink: 0;
  padding: 6px 0;
}

.code-btn.is-disabled {
  color: rgba(255, 255, 255, 0.3);
  cursor: not-allowed;
}

.popup-footer {
  margin-top: 8px;
}

.submit-btn {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.change-btn {
  display: block;
  cursor: pointer;
  font-size: 12px;
  text-align: center;
  margin-top: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.web3-connect,
.web3-connected {
  text-align: center;
  padding: 8px 0;
}

.web3-desc {
  font-size: 13px;
  margin-bottom: 6px;
}

.web3-hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.45);
  margin-bottom: 16px;
}

.wallet-name {
  color: #4ade80;
  font-size: 13px;
  margin-bottom: 6px;
}

.wallet-address {
  font-family: monospace;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 16px;
  word-break: break-all;
}

.popup-error {
  color: #f87171;
  font-size: 12px;
  text-align: center;
  padding-top: 10px;
  margin-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
</style>
