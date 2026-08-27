<template>
  <div class="form-box">
    <div class="field-row">
      <span class="field-label">邮箱</span>
      <input type="text" v-model="email" placeholder="name@company.com" class="field-input" />
    </div>
    <div class="field-row">
      <span class="field-label">密码</span>
      <input type="password" v-model="password" placeholder="请输入密码" class="field-input" />
    </div>
    <div class="btn-row">
      <button class="action-btn" @click="handleLogin">{{ isSubmitting ? '登录中...' : '登录' }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { showToast } from 'vant'
import { useUserStore } from '../../stores/user'

const emit = defineEmits(['login-success'])

const email = ref('')
const password = ref('')
const isSubmitting = ref(false)

const userStore = useUserStore()

const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(String(value || '').trim())


const handleLogin = async () => {
  if (isSubmitting.value) return
  if (!isValidEmail(email.value)) {
    showToast('请输入有效邮箱')
    return
  }
  if (!String(password.value || '')) {
    showToast('请输入密码')
    return
  }

  try {
    isSubmitting.value = true
    userStore.logout()
    await userStore.login({
      email: email.value,
      password: password.value,
    })
    showToast('登录成功')
    emit('login-success')
  } catch (error) {
    console.error('password login failed', error)
    showToast(error?.message || '登录失败')
  } finally {
    isSubmitting.value = false
  }
}
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
