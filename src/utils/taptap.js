const TAP_ACCOUNTS = 'https://accounts.tapapis.cn'
const VERIFIER_KEY = 'taptap_code_verifier'
const STATE_KEY = 'taptap_oauth_state'

export function getTapClientId() {
  return String(import.meta.env.VITE_TAPTAP_CLIENT_ID || '').trim()
}

export function isTapTapWebView() {
  return /TapTap|taptap/i.test(navigator.userAgent || '')
}

export function getRedirectUri() {
  const fromEnv = String(import.meta.env.VITE_TAPTAP_REDIRECT_URI || '').trim()
  if (fromEnv) return fromEnv
  const base = `${window.location.origin}${import.meta.env.BASE_URL || '/'}`
  return new URL('taptap-callback.html', base).href
}

function randomUrlSafe(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

async function pkceChallenge(verifier) {
  const data = new TextEncoder().encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(hash)
  let str = ''
  bytes.forEach((b) => {
    str += String.fromCharCode(b)
  })
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function parseTapJson(res) {
  const json = await res.json().catch(() => ({}))
  const data = json.data && typeof json.data === 'object' ? json.data : json
  return { json, data }
}

export async function tryJsBridgeLogin() {
  const w = window
  const host = w.TapTap || w.taptap || w.tds || w.Tap
  const loginFn = host?.login
  if (typeof loginFn !== 'function') return null
  const token = await loginFn.call(host, { scopes: ['public_profile'] })
  const kid = token?.kid || token?.accessToken?.kid
  const macKey = token?.mac_key || token?.macKey || token?.accessToken?.mac_key
  if (!kid || !macKey) return null
  return { kid, mac_key: macKey }
}

export async function requestDeviceCode(clientId) {
  const body = new URLSearchParams({
    client_id: clientId,
    response_type: 'device_code',
    scope: 'public_profile',
  })
  const res = await fetch(`${TAP_ACCOUNTS}/oauth2/v1/device/code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const { data, json } = await parseTapJson(res)
  if (!data.device_code || !data.qrcode_url) {
    throw new Error(data.error || json.msg || '获取 TapTap 授权二维码失败')
  }
  return data
}

export async function pollDeviceToken(clientId, deviceCode, options = {}) {
  const interval = Math.max(Number(options.interval) || 2, 2) * 1000
  const expiresIn = (Number(options.expiresIn) || 300) * 1000
  const signal = options.signal
  const started = Date.now()

  while (Date.now() - started < expiresIn) {
    if (signal?.aborted) throw new Error('已取消')
    await new Promise((resolve) => setTimeout(resolve, interval))
    if (signal?.aborted) throw new Error('已取消')

    const body = new URLSearchParams({
      grant_type: 'device_token',
      client_id: clientId,
      secret_type: 'hmac-sha-1',
      code: deviceCode,
    })
    const res = await fetch(`${TAP_ACCOUNTS}/oauth2/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const { data, json } = await parseTapJson(res)
    if (data.kid && data.mac_key) {
      return { kid: data.kid, mac_key: data.mac_key }
    }
    const err = data.error || json.error
    if (err === 'authorization_pending' || err === 'authorization_waiting') continue
    if (err === 'slow_down') {
      await new Promise((resolve) => setTimeout(resolve, interval))
      continue
    }
    if (err === 'access_denied') throw new Error('已取消授权')
    if (err === 'invalid_grant_code' || err === 'expired_token') throw new Error('授权已过期，请重试')
    if (err) throw new Error(err)
  }
  throw new Error('授权超时，请重试')
}

export async function beginPkceLogin(clientId) {
  const verifier = randomUrlSafe(64)
  const state = randomUrlSafe(24)
  sessionStorage.setItem(VERIFIER_KEY, verifier)
  sessionStorage.setItem(STATE_KEY, state)
  const challenge = await pkceChallenge(verifier)
  const url = new URL(`${TAP_ACCOUNTS}/oauth2/v1/authorize`)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('redirect_uri', getRedirectUri())
  url.searchParams.set('state', state)
  url.searchParams.set('scope', 'public_profile')
  url.searchParams.set('code_challenge', challenge)
  url.searchParams.set('code_challenge_method', 'S256')
  window.location.assign(url.toString())
}

export async function exchangeAuthCode(clientId, code, state) {
  const savedState = sessionStorage.getItem(STATE_KEY)
  const verifier = sessionStorage.getItem(VERIFIER_KEY)
  if (state && savedState && state !== savedState) {
    throw new Error('授权状态校验失败，请重试')
  }
  if (!verifier) throw new Error('缺少授权校验信息，请重新登录')
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    code,
    redirect_uri: getRedirectUri(),
    code_verifier: verifier,
    secret_type: 'hmac-sha-1',
  })
  const res = await fetch(`${TAP_ACCOUNTS}/oauth2/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  sessionStorage.removeItem(VERIFIER_KEY)
  sessionStorage.removeItem(STATE_KEY)
  const { data, json } = await parseTapJson(res)
  if (!data.kid || !data.mac_key) {
    throw new Error(data.error || json.msg || '换取 TapTap 凭证失败')
  }
  return { kid: data.kid, mac_key: data.mac_key }
}

export function consumeTapCallbackParams() {
  const hash = window.location.hash || ''
  const qIndex = hash.indexOf('?')
  if (qIndex < 0) return { code: '', state: '', error: '' }
  const params = new URLSearchParams(hash.slice(qIndex + 1))
  const code = params.get('taptap_code') || params.get('code') || ''
  const state = params.get('taptap_state') || params.get('state') || ''
  const error = params.get('taptap_error') || params.get('error') || ''
  if (code || error || state) {
    history.replaceState(
      null,
      '',
      `${window.location.pathname}${window.location.search}${hash.slice(0, qIndex)}`,
    )
  }
  return { code, state, error }
}
