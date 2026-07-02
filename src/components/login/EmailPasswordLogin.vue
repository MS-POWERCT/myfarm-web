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
      <span class="action-btn" @click="handleLogin">{{ isSubmitting ? '[登录中...]' : '[登录]' }}</span>
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
