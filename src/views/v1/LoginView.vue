<template>
  <div class="login-page">
    <div class="login-box">
      <div class="brand">
        <div class="title-line">== {{ globalStore.APP_NAME }} ==</div>
        <div class="sub-title">纯文字农场 · 请登录后继续游戏</div>
      </div>

      <div class="mode-row">
        <span class="mode-item" :class="{ active: loginMode === 'email_password' }"
          @click="setLoginMode('email_password')">[邮箱登录]</span>
        <span class="mode-item" :class="{ active: loginMode === 'email_code' }"
          @click="setLoginMode('email_code')">[邮箱验证码]</span>
        <span v-if="web3Support.supported" class="mode-item" :class="{ active: loginMode === 'web3' }"
          @click="setLoginMode('web3')">[Web3]</span>
      </div>

      <div class="form-area">
        <EmailCodeLogin v-if="loginMode === 'email_code'" @login-success="handleLoginSuccess" />
        <EmailPasswordLogin v-else-if="loginMode === 'email_password'" @login-success="handleLoginSuccess" />
        <Web3Login v-else @login-success="handleLoginSuccess" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import EmailCodeLogin from '@/components/login/EmailCodeLogin.vue'
import EmailPasswordLogin from '@/components/login/EmailPasswordLogin.vue'
import Web3Login from '@/components/login/Web3Login.vue'
import { checkWeb3Support } from '@/utils/web3'
import { useGlobalStore } from '@/stores/global'

const LOGIN_MODE_STORAGE_KEY = 'self_youth_login_mode_v1'
const loginMode = ref('email_code')
const web3Support = checkWeb3Support()
const router = useRouter()
const globalStore = useGlobalStore()

const isValidLoginMode = (mode) =>
  mode === 'email_code' || mode === 'email_password' || mode === 'web3'

const readSavedLoginMode = () => {
  try {
    const raw = localStorage.getItem(LOGIN_MODE_STORAGE_KEY)
    if (!raw) return 'email_code'
    return isValidLoginMode(raw) ? raw : 'email_code'
  } catch {
    return 'email_code'
  }
}

const persistLoginMode = (mode) => {
  try {
    localStorage.setItem(LOGIN_MODE_STORAGE_KEY, mode)
  } catch {
    // ignore
  }
}

const setLoginMode = (mode) => {
  loginMode.value = mode
  persistLoginMode(mode)
}

const handleLoginSuccess = () => {
  router.push('/')
}

onMounted(() => {
  loginMode.value = readSavedLoginMode()
})
</script>

<style scoped>
.login-page {
  --ui-btn-bg: transparent;
  --ui-btn-text: var(--green);
  --ui-accent: var(--primary100);
  --ui-input-bg: #1a1a1a;
  --ui-input-border: var(--gray500);
  --ui-autofill: #1a1a1a;
  --ui-label: var(--gray500);
  --ui-text: var(--white);
  --ui-placeholder: #666;

  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 12px 24px;
  background: var(--black100);
  color: var(--white);
  font-family: 'Microsoft YaHei', sans-serif;
  font-size: 12px;
}

.login-box {
  width: 100%;
  max-width: 360px;
  border: 1px solid var(--gray500);
  padding: 16px 14px;
}

.brand {
  text-align: center;
  margin-bottom: 16px;
}

.title-line {
  font-size: 14px;
  font-weight: 700;
  color: var(--white);
}

.sub-title {
  margin-top: 6px;
  font-size: 12px;
  color: var(--gray500);
}

.mode-row {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
}

.mode-item {
  cursor: pointer;
  color: var(--gray500);
}

.mode-item.active {
  color: var(--primary100);
}

.mode-item:hover {
  text-decoration: underline;
}

:deep(.action-btn) {
  border: 1px solid var(--green);
  border-radius: 4px;
  background: transparent;
  color: var(--green);
  font-size: 12px;
  font-weight: 400;
}

:deep(.field-input) {
  border-radius: 4px;
  font-size: 12px;
}

:deep(.code-btn) {
  color: var(--primary100);
}
</style>
