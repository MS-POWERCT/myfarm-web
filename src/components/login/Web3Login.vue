<template>
  <div class="web3-box">
    <div class="web3-desc">使用 Web3 钱包进行身份验证，无需邮箱或密码。</div>

    <div class="address-row">
      <span class="field-label">钱包地址</span>
      <span class="address-text">{{ walletAddress || '点击下方按钮连接钱包' }}</span>
    </div>

    <div v-if="walletAddress" class="wallet-name-row">[{{ walletName }}]</div>

    <div class="btn-row">
      <span v-if="!walletAddress" class="action-btn" @click="handleConnect">{{ connecting ? '[连接中...]' : '[连接钱包]'
      }}</span>
      <span v-else class="action-btn" @click="handleLogin">{{ logging ? '[登录中...]' : '[钱包登录]' }}</span>
    </div>

    <div v-if="walletAddress" class="action-row">
      <span class="disconnect-btn" @click="handleDisconnect">[断开连接]</span>
    </div>

    <div v-if="error" class="error-row">[{{ error }}]</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { showToast } from 'vant'
import { connectWallet, getCurrentAccount, signMessage, formatAddress } from '@/utils/web3'
import { useUserStore } from '@/stores/user'

const emit = defineEmits(['login-success'])

const walletAddress = ref('')
const walletName = ref('')
const connecting = ref(false)
const logging = ref(false)
const error = ref('')
const userStore = useUserStore()

onMounted(async () => {
  await checkExistingConnection()
})

async function checkExistingConnection() {
  try {
    const account = await getCurrentAccount()
    if (account) {
      walletAddress.value = formatAddress(account)
      walletName.value = '已连接'
    }
  } catch (err) {
    console.log('No existing connection')
    error.value = err.message || '连接失败'
    showToast({ message: error.value, position: 'bottom' })
    return
  }
}

async function handleConnect() {
  error.value = ''
  connecting.value = true

  try {
    const result = await connectWallet()
    walletAddress.value = formatAddress(result.address)
    walletName.value = result.wallet
    showToast({ message: '钱包连接成功', position: 'bottom' })
  } catch (err) {
    error.value = err.message || '连接失败'
    if (err.message?.includes('用户拒绝')) {
      showToast({ message: '用户取消了连接', position: 'bottom' })
    }
  } finally {
    connecting.value = false
  }
}

async function handleLogin() {
  error.value = ''
  logging.value = true

  try {
    const fullAddress = await getCurrentAccount()
    if (!fullAddress) {
      throw new Error('请先连接钱包')
    }

    await userStore.web3Sign()
    const nonce = userStore.web3_nonce
    const message = userStore.web3_message
    const signature = await signMessage(message)

    userStore.logout()
    await userStore.web3Login({
      address: fullAddress,
      signature,
      nonce,
    })
    showToast({ message: '登录成功', position: 'bottom' })
    emit('login-success')
  } catch (err) {
    error.value = err.message || '登录失败'
    if (err.message?.includes('用户拒绝')) {
      showToast({ message: '用户取消了签名', position: 'bottom' })
    }
  } finally {
    logging.value = false
  }
}

function handleDisconnect() {
  walletAddress.value = ''
  walletName.value = ''
  error.value = ''
  showToast({ message: '已断开连接', position: 'bottom' })
}
</script>

<style scoped>
.web3-box {
  border: 1px solid var(--gray500);
  padding: 8px;
  margin-bottom: 8px;
}

.web3-desc {

  font-size: 12px;
  margin-bottom: 10px;
}

.address-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.field-label {

  font-size: 12px;
  width: 65px;
  flex-shrink: 0;
}

.address-text {
  color: var(--white);
  font-size: 12px;
  font-family: monospace;
}

.wallet-name-row {
  color: var(--green);
  font-size: 11px;
  margin-bottom: 10px;
}

.btn-row {
  text-align: center;
  padding-top: 8px;
  border-top: 1px dashed var(--gray500);
}

.action-row {
  text-align: center;
  margin-top: 8px;
}

.action-btn {
  color: var(--primary100);
  cursor: pointer;
  font-size: 12px;
}

.action-btn:hover {
  text-decoration: underline;
}

.disconnect-btn {

  cursor: pointer;
  font-size: 12px;
}

.disconnect-btn:hover {
  text-decoration: underline;
}

.error-row {
  color: var(--red);
  font-size: 12px;
  text-align: center;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed var(--gray500);
}
</style>
