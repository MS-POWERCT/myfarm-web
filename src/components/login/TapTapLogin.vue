<template>
  <div class="taptap-box">
    <p class="taptap-desc">使用 TapTap 账号授权登录，无需再填邮箱密码。</p>

    <div v-if="qrcodeUrl" class="qr-wrap">
      <iframe class="qr-frame" :src="qrcodeUrl" title="TapTap 授权" />
      <p class="qr-tip">
        请在打开的页面中确认授权，确认后会自动登录。
        <a class="qr-link" :href="qrcodeUrl" target="_blank" rel="noopener">新窗口打开</a>
      </p>
    </div>

    <div class="btn-row">
      <button class="taptap-btn" type="button" :disabled="busy" @click="handleLogin">
        {{ busy ? '等待授权…' : 'TapTap 登录' }}
      </button>
    </div>
    <div v-if="busy" class="action-row">
      <span class="cancel-btn" @click="cancelWait">取消</span>
    </div>
    <div v-if="error" class="error-row">{{ error }}</div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { showToast } from 'vant'
import { useUserStore } from '@/stores/user'
import {
  beginPkceLogin,
  consumeTapCallbackParams,
  exchangeAuthCode,
  getTapClientId,
  pollDeviceToken,
  requestDeviceCode,
  tryJsBridgeLogin,
} from '@/utils/taptap'

const emit = defineEmits(['login-success'])
const userStore = useUserStore()
const busy = ref(false)
const error = ref('')
const qrcodeUrl = ref('')
let abortWait = null

const clearWait = () => {
  abortWait?.abort()
  abortWait = null
  busy.value = false
  qrcodeUrl.value = ''
}

const finishFarmLogin = async (kid, macKey) => {
  await userStore.taptapLogin({ kid, mac_key: macKey })
  showToast('登录成功')
  emit('login-success')
}

const handleLogin = async () => {
  if (busy.value) return
  error.value = ''
  const clientId = getTapClientId()
  if (!clientId) {
    showToast('未配置 TapTap Client ID')
    return
  }

  busy.value = true
  try {
    const bridgeToken = await tryJsBridgeLogin()
    if (bridgeToken) {
      await finishFarmLogin(bridgeToken.kid, bridgeToken.mac_key)
      return
    }

    try {
      const device = await requestDeviceCode(clientId)
      qrcodeUrl.value = device.qrcode_url
      abortWait = new AbortController()
      const token = await pollDeviceToken(clientId, device.device_code, {
        interval: device.interval,
        expiresIn: device.expires_in,
        signal: abortWait.signal,
      })
      await finishFarmLogin(token.kid, token.mac_key)
      return
    } catch (deviceErr) {
      if (deviceErr?.name === 'AbortError' || deviceErr?.message === '已取消') throw deviceErr
      if (deviceErr?.name !== 'TypeError' && !String(deviceErr?.message || '').includes('Failed to fetch')) {
        throw deviceErr
      }
    }

    await beginPkceLogin(clientId)
  } catch (err) {
    const message = err?.message || 'TapTap 登录失败'
    if (message !== '已取消') {
      error.value = message
      showToast({ message, position: 'bottom' })
    }
  } finally {
    if (!/accounts\.tapapis/.test(window.location.href)) {
      busy.value = false
    }
  }
}

const cancelWait = () => {
  clearWait()
}

onMounted(async () => {
  const { code, state, error: oauthError } = consumeTapCallbackParams()
  if (oauthError) {
    error.value = oauthError === 'access_denied' ? '已取消授权' : oauthError
    return
  }
  if (!code) return
  const clientId = getTapClientId()
  if (!clientId) return
  busy.value = true
  try {
    const token = await exchangeAuthCode(clientId, code, state)
    await finishFarmLogin(token.kid, token.mac_key)
  } catch (err) {
    error.value = err?.message || 'TapTap 登录失败'
    showToast({ message: error.value, position: 'bottom' })
  } finally {
    busy.value = false
  }
})

onBeforeUnmount(() => {
  clearWait()
})
</script>

<style scoped>
.taptap-box {
  padding: 2px 0;
}

.taptap-desc {
  font-size: 12px;
  line-height: 1.5;
  margin-bottom: 14px;
  color: var(--ui-label, rgba(255, 255, 255, 0.6));
}

.qr-wrap {
  margin-bottom: 14px;
}

.qr-frame {
  width: 100%;
  height: 280px;
  border: 0;
  border-radius: 12px;
  background: #fff;
}

.qr-tip {
  margin-top: 8px;
  font-size: 12px;
  text-align: center;
  color: var(--ui-label, rgba(255, 255, 255, 0.55));
}

.qr-link {
  color: var(--ui-accent, #e8c547);
}

.taptap-btn {
  width: 100%;
  padding: 11px;
  border: none;
  border-radius: 12px;
  background: #14b53a;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
}

.taptap-btn:disabled {
  opacity: 0.7;
  cursor: default;
}

.action-row {
  margin-top: 10px;
  text-align: center;
}

.cancel-btn {
  font-size: 12px;
  cursor: pointer;
  color: var(--ui-accent, #e8c547);
}

.error-row {
  margin-top: 10px;
  font-size: 12px;
  color: #f87171;
}
</style>
