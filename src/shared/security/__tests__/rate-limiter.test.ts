import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  ClientRateLimiter,
  getRateLimiter,
  resetRateLimiter,
  DEFAULT_RATE_LIMITER_CONFIG,
} from '../rate-limiter'

describe('ClientRateLimiter', () => {
  let limiter: ClientRateLimiter

  beforeEach(() => {
    vi.useFakeTimers()
    limiter = new ClientRateLimiter({ maxRequests: 5, windowMs: 10_000 })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('canRequest', () => {
    it('разрешает запрос, если лимит не превышен', () => {
      expect(limiter.canRequest()).toBe(true)
    })

    it('блокирует запрос при превышении лимита', () => {
      for (let i = 0; i < 5; i++) {
        limiter.recordRequest()
      }
      expect(limiter.canRequest()).toBe(false)
    })

    it('разрешает запрос после истечения окна', () => {
      for (let i = 0; i < 5; i++) {
        limiter.recordRequest()
      }
      expect(limiter.canRequest()).toBe(false)

      // Перематываем время за пределы окна
      vi.advanceTimersByTime(10_001)
      expect(limiter.canRequest()).toBe(true)
    })

    it('блокирует запрос во время backoff', () => {
      limiter.handleTooManyRequests()
      expect(limiter.canRequest()).toBe(false)
    })

    it('разрешает запрос после истечения backoff', () => {
      limiter.handleTooManyRequests()
      expect(limiter.canRequest()).toBe(false)

      vi.advanceTimersByTime(1_001)
      expect(limiter.canRequest()).toBe(true)
    })
  })

  describe('getWaitTime', () => {
    it('возвращает 0, если запрос разрешён', () => {
      expect(limiter.getWaitTime()).toBe(0)
    })

    it('возвращает время ожидания при превышении лимита', () => {
      for (let i = 0; i < 5; i++) {
        limiter.recordRequest()
      }
      const waitTime = limiter.getWaitTime()
      expect(waitTime).toBeGreaterThan(0)
      expect(waitTime).toBeLessThanOrEqual(10_000)
    })

    it('возвращает время backoff при 429', () => {
      limiter.handleTooManyRequests()
      const waitTime = limiter.getWaitTime()
      expect(waitTime).toBeGreaterThan(0)
      expect(waitTime).toBeLessThanOrEqual(1_000)
    })
  })

  describe('handleTooManyRequests', () => {
    it('устанавливает начальный backoff', () => {
      limiter.handleTooManyRequests()
      expect(limiter.getConsecutiveHits()).toBe(1)
      expect(limiter.canRequest()).toBe(false)
    })

    it('увеличивает backoff экспоненциально', () => {
      limiter.handleTooManyRequests()
      const wait1 = limiter.getWaitTime()

      vi.advanceTimersByTime(wait1 + 1)
      limiter.handleTooManyRequests()
      const wait2 = limiter.getWaitTime()

      expect(wait2).toBeGreaterThan(wait1)
      expect(limiter.getConsecutiveHits()).toBe(2)
    })

    it('использует Retry-After из заголовка', () => {
      limiter.handleTooManyRequests('5')
      const waitTime = limiter.getWaitTime()
      // Retry-After: 5 секунд = 5000 мс
      expect(waitTime).toBeLessThanOrEqual(5_000)
      expect(waitTime).toBeGreaterThan(4_000)
    })

    it('ограничивает максимальный backoff', () => {
      const smallLimiter = new ClientRateLimiter({
        maxRequests: 5,
        windowMs: 10_000,
        initialBackoffMs: 10_000,
        maxBackoffMs: 15_000,
        backoffMultiplier: 3,
      })

      smallLimiter.handleTooManyRequests()
      vi.advanceTimersByTime(10_001)
      smallLimiter.handleTooManyRequests()

      // Должен быть ограничен maxBackoffMs (15_000), а не 10_000 * 3 = 30_000
      const waitTime = smallLimiter.getWaitTime()
      expect(waitTime).toBeLessThanOrEqual(15_000)
    })
  })

  describe('handleSuccess', () => {
    it('сбрасывает backoff после успешного запроса', () => {
      limiter.handleTooManyRequests()
      expect(limiter.canRequest()).toBe(false)

      vi.advanceTimersByTime(1_001)
      limiter.handleSuccess()
      expect(limiter.canRequest()).toBe(true)
      expect(limiter.getConsecutiveHits()).toBe(0)
    })
  })

  describe('reset', () => {
    it('полностью сбрасывает состояние', () => {
      for (let i = 0; i < 5; i++) {
        limiter.recordRequest()
      }
      limiter.handleTooManyRequests()

      limiter.reset()
      expect(limiter.canRequest()).toBe(true)
      expect(limiter.getWaitTime()).toBe(0)
      expect(limiter.getConsecutiveHits()).toBe(0)
    })
  })
})

describe('DEFAULT_RATE_LIMITER_CONFIG', () => {
  it('содержит корректные значения по умолчанию', () => {
    expect(DEFAULT_RATE_LIMITER_CONFIG.maxRequests).toBe(50)
    expect(DEFAULT_RATE_LIMITER_CONFIG.windowMs).toBe(60_000)
    expect(DEFAULT_RATE_LIMITER_CONFIG.initialBackoffMs).toBe(1_000)
    expect(DEFAULT_RATE_LIMITER_CONFIG.maxBackoffMs).toBe(30_000)
    expect(DEFAULT_RATE_LIMITER_CONFIG.backoffMultiplier).toBe(2)
  })
})

describe('getRateLimiter / resetRateLimiter', () => {
  beforeEach(() => {
    resetRateLimiter()
  })

  it('возвращает глобальный экземпляр', () => {
    const limiter1 = getRateLimiter()
    const limiter2 = getRateLimiter()
    expect(limiter1).toBe(limiter2)
  })

  it('создаёт новый экземпляр после сброса', () => {
    const limiter1 = getRateLimiter()
    resetRateLimiter()
    const limiter2 = getRateLimiter()
    expect(limiter1).not.toBe(limiter2)
  })
})
