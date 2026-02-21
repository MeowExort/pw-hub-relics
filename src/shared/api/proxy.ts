/**
 * Прокси-клиент для BFF.
 * Все запросы идут через единый POST /api/proxy с подписью и обфускацией.
 * Включает клиентский rate limiting с экспоненциальным backoff при 429.
 */

import { post, ApiError } from './client'
import { get as httpGet } from './client'
import { createSignedRequest } from '@/shared/security/signing'
import { getRateLimiter } from '@/shared/security/rate-limiter'
import { requestCaptcha, consumeCaptchaToken } from '@/shared/security/captcha'
import { solveChallenge } from '@/shared/security/pow'
import type { ApiAction } from '@/shared/security/actions'

/** Ошибка превышения лимита запросов */
export class RateLimitError extends Error {
  /** Время ожидания до повторного запроса (мс) */
  public retryAfterMs: number

  constructor(retryAfterMs: number) {
    super(`Превышен лимит запросов. Повторите через ${Math.ceil(retryAfterMs / 1000)} сек.`)
    this.name = 'RateLimitError'
    this.retryAfterMs = retryAfterMs
  }
}

/** Ошибка: требуется CAPTCHA */
export class CaptchaRequiredError extends Error {
  constructor() {
    super('Требуется прохождение CAPTCHA')
    this.name = 'CaptchaRequiredError'
  }
}

/**
 * Отправляет подписанный запрос через BFF-прокси.
 * Учитывает клиентский rate limiting и обрабатывает 429 от сервера.
 * @param action — имя действия API
 * @param params — параметры запроса
 * @param signal — сигнал отмены запроса
 * @returns ответ API
 */
export async function proxyRequest<T>(
  action: ApiAction,
  params: Record<string, unknown> = {},
  signal?: AbortSignal,
): Promise<T> {
  const limiter = getRateLimiter()

  // Проверяем клиентский лимит
  if (!limiter.canRequest()) {
    const waitTime = limiter.getWaitTime()
    throw new RateLimitError(waitTime)
  }

  limiter.recordRequest()

  const signedRequest = await createSignedRequest(action, params)

  // Получаем PoW-challenge и решаем его
  const powSolution = await obtainPowSolution()

  try {
    const result = await sendProxyRequest<T>(signedRequest, signal, undefined, powSolution)

    limiter.handleSuccess()
    return result
  } catch (error) {
    // Обработка 429 Too Many Requests от сервера
    if (error instanceof ApiError && error.status === 429) {
      let retryAfterSec: string | undefined
      try {
        const parsed = JSON.parse(error.message)
        if (parsed.retryAfter) {
          retryAfterSec = String(parsed.retryAfter)
        }
      } catch {
        // Тело не JSON — используем дефолтный backoff
      }

      limiter.handleTooManyRequests(retryAfterSec)
      const waitTime = limiter.getWaitTime()
      throw new RateLimitError(waitTime)
    }

    // Обработка 403 с требованием CAPTCHA
    if (error instanceof ApiError && error.status === 403) {
      let isCaptcha = false
      try {
        const parsed = JSON.parse(error.message)
        isCaptcha = parsed.captchaRequired === true
      } catch {
        // Тело не JSON
      }

      if (isCaptcha) {
        // Запрашиваем CAPTCHA у пользователя и повторяем запрос
        const captchaToken = await requestCaptcha()
        const retryRequest = await createSignedRequest(action, params)
        const retryPow = await obtainPowSolution()
        return sendProxyRequest<T>(retryRequest, signal, captchaToken, retryPow)
      }
    }

    throw error
  }
}

/** Ответ эндпоинта /api/pow-challenge */
interface PowChallengeResponse {
  challenge: string
  difficulty: number
}

/** Решённый PoW */
interface PowSolution {
  challenge: string
  nonce: string
}

/**
 * Получает challenge от сервера и решает PoW-задачу.
 */
async function obtainPowSolution(): Promise<PowSolution> {
  const { challenge, difficulty } = await httpGet<PowChallengeResponse>('/api/pow-challenge', { skipAuth: true })
  const nonce = await solveChallenge(challenge, difficulty)
  return { challenge, nonce }
}

/**
 * Отправляет подписанный запрос через BFF-прокси.
 * @param body — подписанный объект запроса
 * @param signal — сигнал отмены
 * @param captchaToken — токен CAPTCHA (если требовался)
 * @param pow — решённый PoW (challenge + nonce)
 */
async function sendProxyRequest<T>(
  body: Record<string, unknown>,
  signal?: AbortSignal,
  captchaToken?: string,
  pow?: PowSolution,
): Promise<T> {
  // Потребляем одноразовый токен из состояния, если не передан явно
  const token = captchaToken || consumeCaptchaToken()
  const headers: Record<string, string> = {}
  if (token) {
    headers['X-Captcha-Token'] = token
  }
  if (pow) {
    headers['X-PoW-Challenge'] = pow.challenge
    headers['X-PoW-Nonce'] = pow.nonce
  }

  return post<T>('/api/proxy', {
    body,
    signal,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  })
}
