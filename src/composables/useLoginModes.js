import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { checkWeb3Support } from '@/utils/web3'
import { isTapTapWebView } from '@/utils/taptap'

const LOGIN_MODE_STORAGE_KEY = 'self_youth_login_mode_v1'

const isValidLoginMode = (mode) =>
  mode === 'email_code' ||
  mode === 'email_password' ||
  mode === 'web3' ||
  mode === 'taptap'

const readSavedLoginMode = () => {
  try {
    const hash = window.location.hash || ''
    if (/taptap_code=|taptap_error=/.test(hash)) return 'taptap'
    const raw = localStorage.getItem(LOGIN_MODE_STORAGE_KEY)
    if (!raw) return isTapTapWebView() ? 'taptap' : 'email_code'
    return isValidLoginMode(raw) ? raw : 'email_code'
  } catch {
    return 'email_code'
  }
}

export function useLoginModes() {
  const loginMode = ref(readSavedLoginMode())
  const web3Support = checkWeb3Support()
  const router = useRouter()

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

  return {
    loginMode,
    web3Support,
    setLoginMode,
    handleLoginSuccess,
  }
}
