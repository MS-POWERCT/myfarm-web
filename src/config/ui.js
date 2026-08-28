/**
 * UI 版本
 *
 * v1  纯文字版（1.0）
 * v2  深蓝玻璃风（2.0）
 * v3  森林绿（3.0，默认）
 *
 * 优先级：设置页选择（localStorage）> VITE_UI_VERSION > 默认 v3
 */
export const UI_STORAGE_KEY = 'farm_ui_version'
export const DEFAULT_UI_VERSION = 'v3'

export const UI_VERSION_OPTIONS = [
  { id: 'v1', label: '1.0', hint: '纯文字版' },
  { id: 'v2', label: '2.0', hint: '深蓝玻璃' },
  { id: 'v3', label: '3.0', hint: '森林绿' },
]

export const UI_PACKS = {
  v1: {
    farm: () => import('@/views/v1/FarmView.vue'),
    login: () => import('@/views/v1/LoginView.vue'),
    settings: () => import('@/views/v1/UserSettingView.vue'),
  },
  v2: {
    farm: () => import('@/views/v2/FarmView.vue'),
    login: () => import('@/views/v2/LoginView.vue'),
    settings: () => import('@/views/v2/UserSettingView.vue'),
  },
  v3: {
    farm: () => import('@/views/v3/FarmView.vue'),
    login: () => import('@/views/v3/LoginView.vue'),
    settings: () => import('@/views/v3/UserSettingView.vue'),
  },
}

export const isUiVersion = (value) => Boolean(value && UI_PACKS[value])

export const resolveUiVersion = () => {
  try {
    const saved = localStorage.getItem(UI_STORAGE_KEY)
    if (isUiVersion(saved)) return saved
  } catch {
    // ignore
  }
  const fromEnv = import.meta.env.VITE_UI_VERSION
  if (isUiVersion(fromEnv)) return fromEnv
  return DEFAULT_UI_VERSION
}

export const setUiVersion = (id) => {
  if (!isUiVersion(id)) return
  try {
    localStorage.setItem(UI_STORAGE_KEY, id)
  } catch {
    // ignore
  }
  window.location.reload()
}

export const UI_VERSION = resolveUiVersion()
export const currentUiPack = UI_PACKS[UI_VERSION] || UI_PACKS[DEFAULT_UI_VERSION]
