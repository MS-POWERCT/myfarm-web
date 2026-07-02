<template>
  <div class="login-page">
    <div class="login-shell">
      <div class="title-line">{{ globalStore.APP_NAME }}</div>

      <div class="sep-line"></div>

      <div class="sub-title">登录账号</div>

      <div class="mode-row">
        <span class="mode-item" :class="{ active: loginMode === 'email_code' }"
          @click="setLoginMode('email_code')">邮箱验证码</span>
        <span class="mode-item" :class="{ active: loginMode === 'email_password' }"
          @click="setLoginMode('email_password')">邮箱+密码</span>
        <span v-if="web3Support.supported" class="mode-item" :class="{ active: loginMode === 'web3' }"
          @click="setLoginMode('web3')">Web3</span>
      </div>

      <div class="form-area">
        <EmailCodeLogin v-if="loginMode === 'email_code'" @login-success="handleLoginSuccess" />
        <EmailPasswordLogin v-else-if="loginMode === 'email_password'" @login-success="handleLoginSuccess" />
        <Web3Login v-else @login-success="handleLoginSuccess" />
      </div>

      <div class="sep-line"></div>

      <div class="visitor-line">
        <span class="visitor-btn" @click="handleVisitorLogin">[游客登录]</span>
      </div>
      <div class="visitor-hint">无需注册，直接体验</div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import EmailCodeLogin from '../components/login/EmailCodeLogin.vue'
import EmailPasswordLogin from '../components/login/EmailPasswordLogin.vue'
import Web3Login from '../components/login/Web3Login.vue'
import { getVisitorId } from '../utils/device'
import { checkWeb3Support } from '../utils/web3'
import { showToast } from 'vant'
import { useUserStore } from '../stores/user'
import { useGlobalStore } from '../stores/global'

const LOGIN_MODE_STORAGE_KEY = 'self_youth_login_mode_v1'
const loginMode = ref('email_code')
const web3Support = checkWeb3Support()
const router = useRouter()
const userStore = useUserStore()
const globalStore = useGlobalStore()

const emit = defineEmits(['login-success'])

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

const handleVisitorLogin = async () => {
  const uuid = await getVisitorId()
  try {
    await userStore.loginVisitor({
      uuid: uuid,
    })
    showToast('登录成功')
  } catch (error) {
    console.error('visitor login failed', error)
    showToast(error?.message || '登录失败')
  }
  emit('login-success')
  router.push('/')
}

onMounted(() => {
  loginMode.value = readSavedLoginMode()
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background-color: var(--black100);
  color: var(--white);
  font-family: 'Microsoft YaHei', sans-serif;
  font-size: 12px;
}

.login-shell {
  max-width: 300px;
  margin: 0 auto;
  padding-top: 40px;
}

.title-line {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: var(--white);
  margin-bottom: 10px;
}

.sep-line {
  border-bottom: 1px dashed var(--gray500);
  margin: 10px 0;
}

.sub-title {
  text-align: center;
  font-size: 14px;

  margin-bottom: 12px;
}

.mode-row {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 14px;
}

.mode-item {

  cursor: pointer;
  font-size: 12px;
}

.mode-item.active {
  color: var(--white);
  font-weight: bold;
}

.mode-item:hover {
  color: var(--primary100);
}

.form-area {
  padding: 4px 0;
}

.visitor-line {
  text-align: center;
  padding: 8px 0;
}

.visitor-btn {
  color: var(--primary100);
  cursor: pointer;
  font-size: 12px;
}

.visitor-btn:hover {
  text-decoration: underline;
}

.visitor-hint {
  text-align: center;

  font-size: 10px;
  margin-top: 4px;
}
</style>
