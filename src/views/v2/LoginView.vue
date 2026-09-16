<template>
  <div class="login-page">
    <div class="login-shell">
      <div class="brand">
        <div class="brand-icon">
          <IconifyIcon icon="mdi:sprout" width="28" />
        </div>
        <div class="title-line">{{ globalStore.APP_NAME }}</div>
        <div class="sub-title">登录账号，继续你的农场</div>
      </div>

      <div class="mode-row">
        <span class="mode-item" :class="{ active: loginMode === 'email_password' }"
          @click="setLoginMode('email_password')">邮箱登录</span>
        <span class="mode-item" :class="{ active: loginMode === 'email_code' }"
          @click="setLoginMode('email_code')">邮箱验证码</span>
        <span class="mode-item" :class="{ active: loginMode === 'taptap' }"
          @click="setLoginMode('taptap')">TapTap</span>
        <span v-if="web3Support.supported" class="mode-item" :class="{ active: loginMode === 'web3' }"
          @click="setLoginMode('web3')">Web3</span>
      </div>

      <div class="form-area">
        <EmailCodeLogin v-if="loginMode === 'email_code'" @login-success="handleLoginSuccess" />
        <EmailPasswordLogin v-else-if="loginMode === 'email_password'" @login-success="handleLoginSuccess" />
        <TapTapLogin v-else-if="loginMode === 'taptap'" @login-success="handleLoginSuccess" />
        <Web3Login v-else-if="loginMode === 'web3'" @login-success="handleLoginSuccess" />
      </div>
    </div>
  </div>
</template>

<script setup>
import EmailCodeLogin from '@/components/login/EmailCodeLogin.vue'
import EmailPasswordLogin from '@/components/login/EmailPasswordLogin.vue'
import Web3Login from '@/components/login/Web3Login.vue'
import TapTapLogin from '@/components/login/TapTapLogin.vue'
import { useGlobalStore } from '@/stores/global'
import { useLoginModes } from '@/composables/useLoginModes'

const { loginMode, web3Support, setLoginMode, handleLoginSuccess } = useLoginModes()
const globalStore = useGlobalStore()
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  padding-top: calc(24px + var(--safe-top));
  padding-bottom: calc(24px + var(--safe-bottom));
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: #fff;
}

.login-shell {
  width: 100%;
  max-width: 360px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 28px 22px 22px;
}

.brand {
  text-align: center;
  margin-bottom: 22px;
}

.brand-icon {
  width: 52px;
  height: 52px;
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: rgba(74, 222, 128, 0.18);
  color: #4ade80;
}

.title-line {
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #00d4ff, #7b2cbf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sub-title {
  margin-top: 6px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
}

.mode-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 18px;
  padding: 4px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.mode-item {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  border-radius: 9px;
  cursor: pointer;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.55);
}

.mode-item.active {
  background: rgba(102, 126, 234, 0.35);
  color: #fff;
  font-weight: 600;
}

.form-area {
  margin-bottom: 0;
}
</style>
