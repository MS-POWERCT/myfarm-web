<template>
  <div class="settings-view">
    <div class="top-nav">
      <span class="link" @click="$router.go(-1)">[返回]</span>
      <span>修改信息</span>
      <span class="nav-spacer"></span>
    </div>

    <div class="block">
      <div class="block-title">== 账户安全 ==</div>
      <div class="row" @click="showEmailPopup = true">
        <span class="label">邮箱</span>
        <span class="value">{{ user?.email || '未绑定' }}</span>
        <span class="link">{{ user?.email ? '[查看]' : '[绑定]' }}</span>
      </div>
      <div class="row" :class="{ disabled: !user?.email }" @click="handlePasswordClick">
        <span class="label">密码</span>
        <span class="value">{{ user?.has_password ? '已设置' : (user?.email ? '未设置' : '请先绑定邮箱') }}</span>
        <span class="link">{{ user?.email ? '[设置]' : '[不可用]' }}</span>
      </div>
      <div class="row" @click="showWeb3Popup = true">
        <span class="label">Web3</span>
        <span class="value">{{ user?.address ? formatAddress(user.address) : '未绑定' }}</span>
        <span class="link">{{ user?.address ? '[查看]' : '[绑定]' }}</span>
      </div>
    </div>

    <div class="block">
      <div class="block-title">== 其他 ==</div>
      <UiVersionSwitch />
      <div class="logout" @click="handleLogout">[退出登录]</div>
    </div>

    <div class="ver">版本 {{ globalStore.APP_VERSION }}</div>

    <div v-if="showEmailPopup" class="mask" @click.self="showEmailPopup = false">
      <div class="panel">
        <div class="panel-head">
          <span>== 绑定邮箱 ==</span>
          <span class="link" @click="showEmailPopup = false">[关闭]</span>
        </div>
        <p class="hint">绑定邮箱后可用于找回密码、接收重要通知</p>
        <div class="field">
          <span>邮箱</span>
          <input v-model="emailForm.email" type="text" placeholder="请输入邮箱地址" />
        </div>
        <div class="field">
          <span>验证码</span>
          <input v-model="emailForm.code" type="text" placeholder="请输入验证码" />
          <span class="link" :class="{ disabled: emailCountdown > 0 || !emailForm.email }" @click="sendEmailCode">
            {{ emailCountdown > 0 ? `[${emailCountdown}s]` : '[发送]' }}
          </span>
        </div>
        <div class="ok" @click="handleBindEmail">{{ emailLoading ? '[绑定中...]' : '[确认绑定]' }}</div>
      </div>
    </div>

    <div v-if="showPasswordPopup" class="mask" @click.self="showPasswordPopup = false">
      <div class="panel">
        <div class="panel-head">
          <span>== 设置密码 ==</span>
          <span class="link" @click="showPasswordPopup = false">[关闭]</span>
        </div>
        <p class="hint">{{ user?.email }} 将收到验证码</p>
        <div class="field">
          <span>验证码</span>
          <input v-model="passwordForm.code" type="text" placeholder="请输入验证码" />
          <span class="link" :class="{ disabled: passwordCountdown > 0 }" @click="sendPasswordCode">
            {{ passwordCountdown > 0 ? `[${passwordCountdown}s]` : '[发送]' }}
          </span>
        </div>
        <div class="field">
          <span>新密码</span>
          <input v-model="passwordForm.password" type="password" placeholder="请输入6位以上密码" />
        </div>
        <div class="field">
          <span>确认密码</span>
          <input v-model="passwordForm.password_confirmation" type="password" placeholder="请再次输入密码" />
        </div>
        <div class="ok" @click="handleSetPassword">{{ passwordLoading ? '[设置中...]' : '[确认设置]' }}</div>
      </div>
    </div>

    <div v-if="showWeb3Popup" class="mask" @click.self="showWeb3Popup = false">
      <div class="panel">
        <div class="panel-head">
          <span>== 绑定Web3钱包 ==</span>
          <span class="link" @click="showWeb3Popup = false">[关闭]</span>
        </div>
        <div v-if="!web3Address">
          <p class="hint">使用 Web3 钱包进行身份验证，连接即可完成绑定</p>
          <div class="ok" @click="handleConnectWallet">{{ web3Connecting ? '[连接中...]' : '[连接钱包]' }}</div>
        </div>
        <div v-else>
          <p class="hint">{{ web3WalletName }}</p>
          <p class="addr">{{ web3Address }}</p>
          <div class="ok" @click="handleBindWeb3">{{ web3Binding ? '[绑定中...]' : '[确认绑定]' }}</div>
          <div class="alt" @click="handleDisconnectWallet">[更换钱包]</div>
        </div>
        <p v-if="web3Error" class="err">{{ web3Error }}</p>
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
  padding: 6px;
  padding-top: calc(6px + env(safe-area-inset-top));
  background: var(--black100);
  color: var(--white);
  font-family: 'Microsoft YaHei', sans-serif;
  font-size: 12px;
}

.top-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px;
  margin-bottom: 10px;
}

.nav-spacer {
  width: 42px;
}

.link {
  color: var(--primary100);
  cursor: pointer;
}

.link:hover {
  text-decoration: underline;
}

.link.disabled {
  color: var(--gray500);
  cursor: not-allowed;
  text-decoration: none;
}

.block {
  border: 1px solid var(--gray500);
  padding: 8px 10px 10px;
  margin-bottom: 10px;
}

.block-title {
  color: var(--gray500);
  margin-bottom: 8px;
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  cursor: pointer;
}

.row.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.label {
  width: 42px;
  flex-shrink: 0;
  color: var(--gray500);
}

.value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.logout {
  color: var(--red);
  cursor: pointer;
  padding-top: 4px;
}

.logout:hover {
  text-decoration: underline;
}

.ver {
  text-align: center;
  color: var(--gray500);
  padding: 8px 0;
}

.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 1000;
}

.panel {
  width: 100%;
  max-width: 340px;
  background: var(--black100);
  border: 1px solid var(--gray500);
  padding: 12px;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.hint {
  margin: 0 0 10px;
  color: var(--gray500);
  line-height: 1.5;
}

.field {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.field span:first-child {
  width: 52px;
  flex-shrink: 0;
  color: var(--gray500);
}

.field input {
  flex: 1;
  min-width: 0;
  background: #1a1a1a;
  border: 1px solid var(--gray500);
  color: var(--white);
  font-size: 12px;
  padding: 6px 8px;
  outline: none;
  border-radius: 4px;
}

.ok {
  margin-top: 8px;
  color: var(--green);
  cursor: pointer;
  text-align: center;
}

.ok:hover,
.alt:hover {
  text-decoration: underline;
}

.alt {
  margin-top: 8px;
  color: var(--gray500);
  cursor: pointer;
  text-align: center;
}

.addr {
  font-family: monospace;
  word-break: break-all;
  margin: 0 0 10px;
}

.err {
  color: var(--red);
  text-align: center;
  margin: 8px 0 0;
}

:deep(.ui-ver) {
  margin: 4px 0 8px;
}

:deep(.ui-ver-row button) {
  border-radius: 4px;
  border: 1px solid var(--gray500);
  background: transparent;
  font-size: 12px;
}

:deep(.ui-ver-row button.on) {
  border-color: var(--primary100);
  color: var(--primary100);
  background: transparent;
}
</style>
