<template>
  <div class="form-box">
    <div class="field-row">
      <span class="field-label">邮箱</span>
      <input type="text" v-model="email" placeholder="name@company.com" class="field-input" />
    </div>
    <div class="field-row">
      <span class="field-label">验证码</span>
      <input type="text" v-model="verificationCode" placeholder="6位验证码" class="field-input" />
      <span class="code-btn" @click="sendCode">[{{ codeButtonText }}]</span>
    </div>
    <div class="btn-row">
      <span class="action-btn" @click="handleLogin">{{ isSubmitting ? '[登录中...]' : '[登录]' }}</span>
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
  border: 1px solid var(--gray500);
  padding: 8px;
  margin-bottom: 8px;
}

.field-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 6px;
}

.field-row:last-child {
  margin-bottom: 0;
}

.field-label {

  font-size: 12px;
  width: 45px;
  flex-shrink: 0;
}

.field-input {
  flex: 1;
  background: var(--black100);
  border: none;
  border-bottom: 1px dashed var(--gray500);
  color: var(--white);
  font-size: 12px;
  outline: none;
  padding: 3px 0;
  min-width: 0;
}

.field-input:-webkit-autofill,
.field-input:-webkit-autofill:hover,
.field-input:-webkit-autofill:focus,
.field-input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 100px var(--black100) inset;
  -webkit-text-fill-color: var(--white);
  transition: background-color 5000s ease-in-out 0s;
}

.field-input::placeholder {}

.code-btn {
  color: var(--primary100);
  cursor: pointer;
  font-size: 12px;
  flex-shrink: 0;
}

.code-btn:hover {
  text-decoration: underline;
}

.btn-row {
  text-align: center;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--gray500);
}

.action-btn {
  color: var(--primary100);
  cursor: pointer;
  font-size: 12px;
}

.action-btn:hover {
  text-decoration: underline;
}
</style>
