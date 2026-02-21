import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getAccessToken,
  getRefreshToken,
  getIdToken,
  setTokensFromResponse,
  clearTokens,
  isAuthenticated,
  refreshAccessToken,
  exchangeCodeForTokens,
  saveCodeVerifier,
  consumeCodeVerifier,
  generateCodeVerifier,
  generateCodeChallenge,
  base64UrlEncode,
  _resetRefreshState,
  OIDC_CONFIG,
  type OidcTokenResponse,
} from '../auth'

describe('auth (OIDC + PKCE)', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    _resetRefreshState()
    vi.restoreAllMocks()
  })

  const mockTokenResponse: OidcTokenResponse = {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    id_token: 'test-id-token',
    token_type: 'Bearer',
    expires_in: 3600,
    scope: 'openid offline_access relics:read',
  }

  describe('OIDC_CONFIG', () => {
    it('содержит правильный clientId и scope', () => {
      expect(OIDC_CONFIG.clientId).toBe('relics')
      expect(OIDC_CONFIG.scope).toBe('openid offline_access relics:read')
      expect(OIDC_CONFIG.responseType).toBe('code')
    })

    it('указывает на правильные эндпоинты провайдера', () => {
      expect(OIDC_CONFIG.authorizationEndpoint).toBe('https://api.pw-hub.ru/connect/authorize')
      expect(OIDC_CONFIG.tokenEndpoint).toBe('https://api.pw-hub.ru/connect/token')
      expect(OIDC_CONFIG.endSessionEndpoint).toBe('https://api.pw-hub.ru/connect/logout')
    })
  })

  describe('управление токенами', () => {
    it('возвращает null если токены не установлены', () => {
      expect(getAccessToken()).toBeNull()
      expect(getRefreshToken()).toBeNull()
      expect(getIdToken()).toBeNull()
    })

    it('сохраняет и возвращает все токены из ответа', () => {
      setTokensFromResponse(mockTokenResponse)
      expect(getAccessToken()).toBe('test-access-token')
      expect(getRefreshToken()).toBe('test-refresh-token')
      expect(getIdToken()).toBe('test-id-token')
    })

    it('очищает все токены', () => {
      setTokensFromResponse(mockTokenResponse)
      clearTokens()
      expect(getAccessToken()).toBeNull()
      expect(getRefreshToken()).toBeNull()
      expect(getIdToken()).toBeNull()
    })
  })

  describe('isAuthenticated', () => {
    it('возвращает false без токена', () => {
      expect(isAuthenticated()).toBe(false)
    })

    it('возвращает true с токеном', () => {
      setTokensFromResponse(mockTokenResponse)
      expect(isAuthenticated()).toBe(true)
    })
  })

  describe('PKCE: code_verifier', () => {
    it('сохраняет и потребляет code_verifier (одноразово)', () => {
      saveCodeVerifier('test-verifier')
      expect(consumeCodeVerifier()).toBe('test-verifier')
      // Второй вызов возвращает null — verifier удалён
      expect(consumeCodeVerifier()).toBeNull()
    })
  })

  describe('PKCE: base64UrlEncode', () => {
    it('кодирует байты в base64url без padding', () => {
      const bytes = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
      const result = base64UrlEncode(bytes)
      expect(result).toBe('SGVsbG8')
      expect(result).not.toContain('+')
      expect(result).not.toContain('/')
      expect(result).not.toContain('=')
    })
  })

  describe('PKCE: generateCodeVerifier', () => {
    it('генерирует непустую строку', () => {
      const verifier = generateCodeVerifier()
      expect(verifier.length).toBeGreaterThan(40)
    })
  })

  describe('PKCE: generateCodeChallenge', () => {
    it('генерирует challenge отличный от verifier (S256)', async () => {
      const verifier = 'test-verifier-string'
      const challenge = await generateCodeChallenge(verifier)
      expect(challenge).not.toBe(verifier)
      expect(challenge.length).toBeGreaterThan(0)
    })
  })

  describe('exchangeCodeForTokens', () => {
    it('возвращает null если нет code_verifier', async () => {
      const result = await exchangeCodeForTokens('auth-code')
      expect(result).toBeNull()
    })

    it('обменивает code на токены при наличии verifier', async () => {
      saveCodeVerifier('my-verifier')

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockTokenResponse), { status: 200 }),
      )

      const result = await exchangeCodeForTokens('auth-code')
      expect(result).toEqual(mockTokenResponse)
      expect(getAccessToken()).toBe('test-access-token')
    })

    it('отправляет правильные параметры на token endpoint', async () => {
      saveCodeVerifier('my-verifier')

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockTokenResponse), { status: 200 }),
      )

      await exchangeCodeForTokens('auth-code')

      const call = fetchSpy.mock.calls[0]
      expect(call[0]).toBe(OIDC_CONFIG.tokenEndpoint)
      const body = new URLSearchParams(call[1]?.body as string)
      expect(body.get('grant_type')).toBe('authorization_code')
      expect(body.get('client_id')).toBe('relics')
      expect(body.get('code')).toBe('auth-code')
      expect(body.get('code_verifier')).toBe('my-verifier')
    })

    it('возвращает null при ошибке сервера', async () => {
      saveCodeVerifier('my-verifier')

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('Bad Request', { status: 400 }),
      )

      const result = await exchangeCodeForTokens('bad-code')
      expect(result).toBeNull()
    })
  })

  describe('refreshAccessToken', () => {
    it('возвращает null если нет refresh-токена', async () => {
      const result = await refreshAccessToken()
      expect(result).toBeNull()
    })

    it('обновляет токены при успешном ответе', async () => {
      setTokensFromResponse(mockTokenResponse)

      const freshTokens: OidcTokenResponse = {
        access_token: 'fresh-access',
        refresh_token: 'fresh-refresh',
        token_type: 'Bearer',
        expires_in: 3600,
      }

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(freshTokens), { status: 200 }),
      )

      const result = await refreshAccessToken()
      expect(result).toEqual(freshTokens)
      expect(getAccessToken()).toBe('fresh-access')
      expect(getRefreshToken()).toBe('fresh-refresh')
    })

    it('отправляет refresh_token grant на token endpoint', async () => {
      setTokensFromResponse(mockTokenResponse)

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response(JSON.stringify(mockTokenResponse), { status: 200 }),
      )

      await refreshAccessToken()

      const call = fetchSpy.mock.calls[0]
      expect(call[0]).toBe(OIDC_CONFIG.tokenEndpoint)
      const body = new URLSearchParams(call[1]?.body as string)
      expect(body.get('grant_type')).toBe('refresh_token')
      expect(body.get('client_id')).toBe('relics')
      expect(body.get('refresh_token')).toBe('test-refresh-token')
    })

    it('очищает токены при неудачном refresh', async () => {
      setTokensFromResponse(mockTokenResponse)

      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
        new Response('Unauthorized', { status: 401 }),
      )

      const result = await refreshAccessToken()
      expect(result).toBeNull()
      expect(getAccessToken()).toBeNull()
    })

    it('очищает токены при сетевой ошибке', async () => {
      setTokensFromResponse(mockTokenResponse)

      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'))

      const result = await refreshAccessToken()
      expect(result).toBeNull()
      expect(getAccessToken()).toBeNull()
    })
  })
})
