import { describe, it, expect } from 'vitest'
import { sha256, hmacSha256, generateNonce } from '../crypto'

describe('crypto', () => {
  describe('sha256', () => {
    it('вычисляет корректный SHA-256 хеш пустой строки', async () => {
      const hash = await sha256('')
      expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')
    })

    it('вычисляет корректный SHA-256 хеш строки "hello"', async () => {
      const hash = await sha256('hello')
      expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824')
    })

    it('возвращает hex-строку длиной 64 символа', async () => {
      const hash = await sha256('test')
      expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })

    it('детерминирован — одинаковый вход даёт одинаковый выход', async () => {
      const h1 = await sha256('deterministic')
      const h2 = await sha256('deterministic')
      expect(h1).toBe(h2)
    })
  })

  describe('hmacSha256', () => {
    it('возвращает hex-строку длиной 64 символа', async () => {
      const sig = await hmacSha256('message', 'secret')
      expect(sig).toMatch(/^[0-9a-f]{64}$/)
    })

    it('детерминирован при одинаковых входных данных', async () => {
      const s1 = await hmacSha256('msg', 'key')
      const s2 = await hmacSha256('msg', 'key')
      expect(s1).toBe(s2)
    })

    it('разные ключи дают разные подписи', async () => {
      const s1 = await hmacSha256('message', 'key1')
      const s2 = await hmacSha256('message', 'key2')
      expect(s1).not.toBe(s2)
    })

    it('разные сообщения дают разные подписи', async () => {
      const s1 = await hmacSha256('msg1', 'key')
      const s2 = await hmacSha256('msg2', 'key')
      expect(s1).not.toBe(s2)
    })
  })

  describe('generateNonce', () => {
    it('возвращает hex-строку длиной 32 символа', () => {
      const nonce = generateNonce()
      expect(nonce).toMatch(/^[0-9a-f]{32}$/)
    })

    it('генерирует уникальные значения', () => {
      const nonces = new Set(Array.from({ length: 100 }, () => generateNonce()))
      expect(nonces.size).toBe(100)
    })
  })
})
