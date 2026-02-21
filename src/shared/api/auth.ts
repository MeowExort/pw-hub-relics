/**
 * Сервис аутентификации через OpenID Connect.
 * Authorization Code + PKCE flow.
 * Провайдер: https://api.pw-hub.ru
 * Клиент: relics
 * Scope: openid offline_access relics:read
 */

/** Конфигурация OIDC-провайдера */
export const OIDC_CONFIG = {
  /** URL авторизации */
  authorizationEndpoint: 'https://api.pw-hub.ru/connect/authorize',
  /** URL получения/обновления токенов */
  tokenEndpoint: 'https://api.pw-hub.ru/connect/token',
  /** URL завершения сессии */
  endSessionEndpoint: 'https://api.pw-hub.ru/connect/logout',
  /** Идентификатор клиента */
  clientId: 'relics',
  /** Запрашиваемые разрешения */
  scope: 'openid offline_access relics:read',
  /** URL перенаправления после авторизации */
  redirectUri: `${window.location.origin}/callback`,
  /** Тип ответа */
  responseType: 'code',
} as const

/** Ключи хранения в localStorage/sessionStorage */
const ACCESS_TOKEN_KEY = 'oidc_access_token'
const REFRESH_TOKEN_KEY = 'oidc_refresh_token'
const ID_TOKEN_KEY = 'oidc_id_token'
const CODE_VERIFIER_KEY = 'oidc_code_verifier'

/** Ответ token endpoint */
export interface OidcTokenResponse {
  access_token: string
  refresh_token?: string
  id_token?: string
  token_type: string
  expires_in: number
  scope?: string
}

/** Флаг текущего процесса обновления токена */
let refreshPromise: Promise<OidcTokenResponse | null> | null = null

// --- PKCE утилиты ---

/**
 * Генерирует криптографически случайную строку для code_verifier.
 * Длина 128 символов из допустимого алфавита (RFC 7636).
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(96)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

/**
 * Вычисляет code_challenge из code_verifier методом S256.
 * SHA-256 хеш → base64url.
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(digest))
}

/**
 * Base64url-кодирование (без padding, URL-safe).
 */
export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// --- Управление токенами ---

/** Получение access-токена */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

/** Получение refresh-токена */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

/** Получение id-токена */
export function getIdToken(): string | null {
  return localStorage.getItem(ID_TOKEN_KEY)
}

/** Сохранение токенов из ответа token endpoint */
export function setTokensFromResponse(response: OidcTokenResponse): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, response.access_token)
  if (response.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refresh_token)
  }
  if (response.id_token) {
    localStorage.setItem(ID_TOKEN_KEY, response.id_token)
  }
}

/** Удаление всех токенов (выход) */
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(ID_TOKEN_KEY)
  sessionStorage.removeItem(CODE_VERIFIER_KEY)
}

/** Проверяет, аутентифицирован ли пользователь */
export function isAuthenticated(): boolean {
  return getAccessToken() !== null
}

// --- PKCE state (code_verifier) ---

/** Сохранение code_verifier в sessionStorage */
export function saveCodeVerifier(verifier: string): void {
  sessionStorage.setItem(CODE_VERIFIER_KEY, verifier)
}

/** Получение и удаление code_verifier из sessionStorage */
export function consumeCodeVerifier(): string | null {
  const verifier = sessionStorage.getItem(CODE_VERIFIER_KEY)
  sessionStorage.removeItem(CODE_VERIFIER_KEY)
  return verifier
}

// --- Authorization flow ---

/**
 * Инициирует авторизацию: генерирует PKCE, сохраняет verifier,
 * перенаправляет на authorization endpoint.
 */
export async function startLogin(): Promise<void> {
  const verifier = generateCodeVerifier()
  saveCodeVerifier(verifier)

  const challenge = await generateCodeChallenge(verifier)

  const params = new URLSearchParams({
    client_id: OIDC_CONFIG.clientId,
    redirect_uri: OIDC_CONFIG.redirectUri,
    response_type: OIDC_CONFIG.responseType,
    scope: OIDC_CONFIG.scope,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  })

  window.location.href = `${OIDC_CONFIG.authorizationEndpoint}?${params.toString()}`
}

/**
 * Обменивает authorization code на токены.
 * Использует сохранённый code_verifier для PKCE.
 */
export async function exchangeCodeForTokens(code: string): Promise<OidcTokenResponse | null> {
  const verifier = consumeCodeVerifier()
  if (!verifier) return null

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: OIDC_CONFIG.clientId,
    redirect_uri: OIDC_CONFIG.redirectUri,
    code,
    code_verifier: verifier,
  })

  try {
    const response = await fetch(OIDC_CONFIG.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    if (!response.ok) return null

    const tokens: OidcTokenResponse = await response.json()
    setTokensFromResponse(tokens)
    return tokens
  } catch {
    return null
  }
}

// --- Refresh token ---

/**
 * Обновление access-токена через refresh_token.
 * Mutex предотвращает параллельные запросы.
 */
export async function refreshAccessToken(): Promise<OidcTokenResponse | null> {
  if (refreshPromise) return refreshPromise

  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  refreshPromise = performRefresh(refreshToken)

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

/** Выполняет запрос обновления токена */
async function performRefresh(refreshToken: string): Promise<OidcTokenResponse | null> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: OIDC_CONFIG.clientId,
    refresh_token: refreshToken,
  })

  try {
    const response = await fetch(OIDC_CONFIG.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    if (!response.ok) {
      clearTokens()
      return null
    }

    const tokens: OidcTokenResponse = await response.json()
    setTokensFromResponse(tokens)
    return tokens
  } catch {
    clearTokens()
    return null
  }
}

// --- Logout ---

/**
 * Выход: очищает токены и перенаправляет на end_session_endpoint.
 */
export function logout(): void {
  const idToken = getIdToken()
  clearTokens()

  const params = new URLSearchParams({
    post_logout_redirect_uri: window.location.origin,
  })
  if (idToken) {
    params.set('id_token_hint', idToken)
  }

  window.location.href = `${OIDC_CONFIG.endSessionEndpoint}?${params.toString()}`
}

/**
 * Сбрасывает внутреннее состояние модуля (для тестов).
 */
export function _resetRefreshState(): void {
  refreshPromise = null
}
