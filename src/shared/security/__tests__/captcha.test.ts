import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  isCaptchaRequired,
  getCaptchaToken,
  getHcaptchaSiteKey,
  requestCaptcha,
  solveCaptcha,
  cancelCaptcha,
  consumeCaptchaToken,
  resetCaptchaState,
  onCaptchaRequired,
} from '../captcha'

describe('captcha', () => {
  beforeEach(() => {
    resetCaptchaState()
  })

  describe('начальное состояние', () => {
    it('CAPTCHA не требуется по умолчанию', () => {
      expect(isCaptchaRequired()).toBe(false)
    })

    it('токен отсутствует по умолчанию', () => {
      expect(getCaptchaToken()).toBeNull()
    })

    it('возвращает публичный ключ hCaptcha', () => {
      const key = getHcaptchaSiteKey()
      expect(typeof key).toBe('string')
      expect(key.length).toBeGreaterThan(0)
    })
  })

  describe('requestCaptcha', () => {
    it('устанавливает флаг required в true', () => {
      const promise = requestCaptcha()
      expect(isCaptchaRequired()).toBe(true)
      solveCaptcha('cleanup')
      return promise
    })

    it('сбрасывает токен при запросе', () => {
      solveCaptcha('old-token')
      const promise = requestCaptcha()
      expect(getCaptchaToken()).toBeNull()
      solveCaptcha('cleanup')
      return promise
    })

    it('возвращает промис, который резолвится при решении', async () => {
      const promise = requestCaptcha()
      solveCaptcha('test-token-123')
      const token = await promise
      expect(token).toBe('test-token-123')
    })
  })

  describe('solveCaptcha', () => {
    it('сохраняет токен', () => {
      solveCaptcha('solved-token')
      expect(getCaptchaToken()).toBe('solved-token')
    })

    it('сбрасывает флаг required', () => {
      requestCaptcha()
      expect(isCaptchaRequired()).toBe(true)
      solveCaptcha('token')
      expect(isCaptchaRequired()).toBe(false)
    })

    it('уведомляет ожидающий промис', async () => {
      const promise = requestCaptcha()
      solveCaptcha('my-token')
      await expect(promise).resolves.toBe('my-token')
    })
  })

  describe('cancelCaptcha', () => {
    it('сбрасывает флаг required', () => {
      const promise = requestCaptcha()
      promise.catch(() => { /* ожидаемый реджект */ })
      cancelCaptcha()
      expect(isCaptchaRequired()).toBe(false)
    })

    it('сбрасывает токен', () => {
      solveCaptcha('token')
      requestCaptcha()
        .catch(() => { /* ожидаемый реджект */ })
      cancelCaptcha()
      expect(getCaptchaToken()).toBeNull()
    })

    it('реджектит ожидающий промис', async () => {
      const promise = requestCaptcha()
      cancelCaptcha()
      await expect(promise).rejects.toThrow('CAPTCHA отменена пользователем')
    })
  })

  describe('consumeCaptchaToken', () => {
    it('возвращает токен и сбрасывает его', () => {
      solveCaptcha('one-time-token')
      const token = consumeCaptchaToken()
      expect(token).toBe('one-time-token')
      expect(getCaptchaToken()).toBeNull()
    })

    it('возвращает null если токена нет', () => {
      expect(consumeCaptchaToken()).toBeNull()
    })
  })

  describe('onCaptchaRequired', () => {
    it('вызывает слушателя при requestCaptcha', () => {
      const listener = vi.fn()
      onCaptchaRequired(listener)
      const promise = requestCaptcha()
      expect(listener).toHaveBeenCalledWith(true)
      solveCaptcha('cleanup')
      return promise
    })

    it('вызывает слушателя при solveCaptcha', () => {
      const listener = vi.fn()
      onCaptchaRequired(listener)
      requestCaptcha()
      solveCaptcha('token')
      expect(listener).toHaveBeenCalledWith(false)
    })

    it('вызывает слушателя при cancelCaptcha', () => {
      const listener = vi.fn()
      onCaptchaRequired(listener)
      requestCaptcha().catch(() => { /* ожидаемый реджект */ })
      cancelCaptcha()
      expect(listener).toHaveBeenLastCalledWith(false)
    })

    it('возвращает функцию отписки', () => {
      const listener = vi.fn()
      const unsubscribe = onCaptchaRequired(listener)
      unsubscribe()
      const promise = requestCaptcha()
      expect(listener).not.toHaveBeenCalled()
      solveCaptcha('cleanup')
      return promise
    })
  })

  describe('resetCaptchaState', () => {
    it('сбрасывает всё состояние', async () => {
      const p1 = requestCaptcha()
      solveCaptcha('token')
      await p1
      const listener = vi.fn()
      onCaptchaRequired(listener)

      resetCaptchaState()

      expect(isCaptchaRequired()).toBe(false)
      expect(getCaptchaToken()).toBeNull()
      // Слушатели очищены — не вызываются
      const p2 = requestCaptcha()
      expect(listener).not.toHaveBeenCalled()
      solveCaptcha('cleanup')
      await p2
    })
  })
})
