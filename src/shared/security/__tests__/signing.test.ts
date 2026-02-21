import { describe, it, expect, beforeEach } from 'vitest'
import { createSignedRequest } from '../signing'
import { resetFingerprint } from '../fingerprint'

describe('signing', () => {
  beforeEach(() => {
    sessionStorage.clear()
    resetFingerprint()
  })

  describe('createSignedRequest', () => {
    it('возвращает объект с обязательными полями', async () => {
      const req = await createSignedRequest('searchRelics', { page: 1 })
      expect(req).toHaveProperty('action')
      expect(req).toHaveProperty('payload')
      expect(req).toHaveProperty('signature')
      expect(req).toHaveProperty('timestamp')
      expect(req).toHaveProperty('nonce')
    })

    it('action содержит обфусцированный идентификатор', async () => {
      const req = await createSignedRequest('searchRelics')
      expect(typeof req.action).toBe('string')
      expect(req.action.length).toBeGreaterThan(0)
    })

    it('payload содержит сериализованные параметры', async () => {
      const params = { page: 1, query: 'test' }
      const req = await createSignedRequest('searchRelics', params)
      expect(req.payload).toBe(JSON.stringify(params))
    })

    it('payload пустого запроса — пустой объект', async () => {
      const req = await createSignedRequest('getServers')
      expect(req.payload).toBe('{}')
    })

    it('signature — hex-строка длиной 64 символа (HMAC-SHA256)', async () => {
      const req = await createSignedRequest('searchRelics')
      expect(req.signature).toMatch(/^[0-9a-f]{64}$/)
    })

    it('timestamp близок к текущему времени', async () => {
      const before = Date.now()
      const req = await createSignedRequest('searchRelics')
      const after = Date.now()
      expect(req.timestamp).toBeGreaterThanOrEqual(before)
      expect(req.timestamp).toBeLessThanOrEqual(after)
    })

    it('nonce — hex-строка длиной 32 символа', async () => {
      const req = await createSignedRequest('searchRelics')
      expect(req.nonce).toMatch(/^[0-9a-f]{32}$/)
    })

    it('каждый запрос имеет уникальный nonce', async () => {
      const req1 = await createSignedRequest('searchRelics')
      const req2 = await createSignedRequest('searchRelics')
      expect(req1.nonce).not.toBe(req2.nonce)
    })

    it('разные параметры дают разные подписи', async () => {
      const req1 = await createSignedRequest('searchRelics', { page: 1 })
      const req2 = await createSignedRequest('searchRelics', { page: 2 })
      expect(req1.signature).not.toBe(req2.signature)
    })
  })
})
