<template>
  <div class="form-box">
    <div class="field-row">
      <span class="field-label">邮箱</span>
      <input type="text" v-model="email" placeholder="name@company.com" class="field-input" />
    </div>
    <div class="field-row">
      <span class="field-label">验证码</span>
      <input type="text" v-model="verificationCode" placeholder="6位验证码" class="field-input" />
      <span class="code-btn" @click="sendCode">{{ codeButtonText }}</span>
    </div>
    <div class="btn-row">
      <button class="action-btn" @click="handleLogin">{{ isSubmitting ? '登录中...' : '登录' }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import { showToast } from 'vant'
import { useUserStore } from '../../stores/user'
import { globalApi } from '../../api/global'
import { useGlobalStore } from '@/stores/global'

const emit = defineEmits(['login-success'])
const globalStore = useGlobalStore()

const email = ref('')
const verificationCode = ref('')
const isGettingCode = ref(false)
const isSubmitting = ref(false)
const codeButtonText = ref('获取验证码')
const countdown = ref(0)
const countdownTimer = ref(null)

const userStore = useUserStore()

const clearCountdownTimer = () => {
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
}

const startCountdown = () => {
  clearCountdownTimer()
  countdown.value = globalStore.initData.llconfig.EMAIL_CODE_TIME
  isGettingCode.value = true
  codeButtonText.value = `${countdown.value}s`

  countdownTimer.value = setInterval(() => {
    countdown.value--
    codeButtonText.value = `${countdown.value}s`
    if (countdown.value <= 0) {
      clearCountdownTimer()
      codeButtonText.value = '获取验证码'
      isGettingCode.value = false
    }
  }, 1000)
}

const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(String(value || '').trim())

const sendCode = async () => {
  if (isGettingCode.value) return
  if (!isValidEmail(email.value)) {
    showToast('请输入有效邮箱')
    return
  }

  try {
    await globalApi.sendCode({ email: email.value, category: 'login' })
    showToast('验证码已发送')
    startCountdown()
  } catch (error) {
    console.error('sendCode failed', error)
    showToast(error?.message || '发送验证码失败')
    clearCountdownTimer()
    isGettingCode.value = false
    codeButtonText.value = '获取验证码'
  }
}

const handleLogin = async () => {
  if (isSubmitting.value) return
  if (!isValidEmail(email.value)) {
    showToast('请输入有效邮箱')
    return
  }
  if (!String(verificationCode.value || '').trim()) {
    showToast('请输入验证码')
    return
  }

  try {
    isSubmitting.value = true
    userStore.logout()
    await userStore.loginEmail({
      email: email.value,
      code: verificationCode.value,
    })
    showToast('登录成功')
    emit('login-success')
  } catch (error) {
    console.error('email code login failed', error)
    showToast(error?.message || '登录失败')
  } finally {
    isSubmitting.value = false
  }
}

onBeforeUnmount(() => {
  clearCountdownTimer()
})
</script>

<style scoped>
.form-box {
  padding: 2px 0;
}

.field-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}

.field-label {
  font-size: 13px;
  width: 48px;
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.6);
}

.field-input {
  flex: 1;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #fff;
  font-size: 13px;
  outline: none;
  padding: 10px 12px;
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
  white-space: nowrap;
}

.btn-row {
  margin-top: 4px;
}

.action-btn {
  width: 100%;
  padding: 11px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
</style>
