import { describe, it, expect, beforeEach } from 'vitest'
import { getFingerprint, resetFingerprint, collectBrowserTraits } from '../fingerprint'

describe('fingerprint', () => {
  beforeEach(() => {
    sessionStorage.clear()
    resetFingerprint()
  })

  describe('collectBrowserTraits', () => {
    it('возвращает массив характеристик браузера', () => {
      const traits = collectBrowserTraits()
      expect(Array.isArray(traits)).toBe(true)
      expect(traits.length).toBeGreaterThanOrEqual(6)
    })

    it('включает user-agent', () => {
      const traits = collectBrowserTraits()
      expect(traits).toContain(navigator.userAgent)
    })

    it('включает язык браузера', () => {
      const traits = collectBrowserTraits()
      expect(traits).toContain(navigator.language)
    })
  })

  describe('getFingerprint', () => {
    it('возвращает строку-хеш', () => {
      const fp = getFingerprint()
      expect(typeof fp).toBe('string')
      expect(fp.length).toBe(8)
    })

    it('возвращает одинаковый результат при повторных вызовах', () => {
      const fp1 = getFingerprint()
      const fp2 = getFingerprint()
      expect(fp1).toBe(fp2)
    })

    it('кэширует результат в sessionStorage', () => {
      const fp = getFingerprint()
      expect(sessionStorage.getItem('device_fingerprint')).toBe(fp)
    })

    it('использует кэш из sessionStorage', () => {
      sessionStorage.setItem('device_fingerprint', 'cached_fp')
      expect(getFingerprint()).toBe('cached_fp')
    })
  })

  describe('resetFingerprint', () => {
    it('очищает кэшированный fingerprint', () => {
      getFingerprint()
      expect(sessionStorage.getItem('device_fingerprint')).not.toBeNull()
      resetFingerprint()
      expect(sessionStorage.getItem('device_fingerprint')).toBeNull()
    })
  })
})
