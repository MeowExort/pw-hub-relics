/**
 * Модуль Rate Limiting на стороне клиента.
 * Обрабатывает ответы 429 Too Many Requests с экспоненциальным backoff.
 * Также реализует клиентский троттлинг для предотвращения лишних запросов.
 */

/** Конфигурация rate limiter */
export interface RateLimiterConfig {
  /** Максимальное количество запросов в окне */
  maxRequests: number
  /** Размер окна в миллисекундах */
  windowMs: number
  /** Начальная задержка backoff при 429 (мс) */
  initialBackoffMs: number
  /** Максимальная задержка backoff (мс) */
  maxBackoffMs: number
  /** Множитель экспоненциального backoff */
  backoffMultiplier: number
}

/** Конфигурация по умолчанию */
export const DEFAULT_RATE_LIMITER_CONFIG: RateLimiterConfig = {
  maxRequests: 50,
  windowMs: 60_000,
  initialBackoffMs: 1_000,
  maxBackoffMs: 30_000,
  backoffMultiplier: 2,
}

/** Состояние backoff после получения 429 */
interface BackoffState {
  /** Текущая задержка (мс) */
  currentDelayMs: number
  /** Время, до которого нужно ждать */
  retryAfter: number
  /** Количество последовательных 429 */
  consecutiveHits: number
}

/**
 * Клиентский rate limiter.
 * Отслеживает частоту запросов и управляет backoff при 429.
 */
export class ClientRateLimiter {
  private timestamps: number[] = []
  private backoff: BackoffState | null = null
  private readonly config: RateLimiterConfig

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = { ...DEFAULT_RATE_LIMITER_CONFIG, ...config }
  }

  /**
   * Проверяет, можно ли отправить запрос прямо сейчас.
   * @returns true если запрос разрешён
   */
  canRequest(): boolean {
    const now = Date.now()

    // Проверяем backoff после 429
    if (this.backoff && now < this.backoff.retryAfter) {
      return false
    }

    // Очищаем устаревшие записи
    this.cleanup(now)

    return this.timestamps.length < this.config.maxRequests
  }

  /**
   * Возвращает время ожидания до следующего разрешённого запроса (мс).
   * 0 — если запрос можно отправить сейчас.
   */
  getWaitTime(): number {
    const now = Date.now()

    // Backoff после 429
    if (this.backoff && now < this.backoff.retryAfter) {
      return this.backoff.retryAfter - now
    }

    // Очищаем устаревшие записи
    this.cleanup(now)

    if (this.timestamps.length < this.config.maxRequests) {
      return 0
    }

    // Ждём, пока самый старый запрос выйдет из окна
    const oldest = this.timestamps[0]
    return oldest + this.config.windowMs - now
  }

  /**
   * Регистрирует отправленный запрос.
   */
  recordRequest(): void {
    this.timestamps.push(Date.now())
  }

  /**
   * Обрабатывает ответ 429 Too Many Requests.
   * Увеличивает backoff экспоненциально.
   * @param retryAfterHeader — значение заголовка Retry-After (секунды)
   */
  handleTooManyRequests(retryAfterHeader?: string): void {
    const now = Date.now()

    let delayMs: number
    if (retryAfterHeader) {
      const seconds = parseInt(retryAfterHeader, 10)
      delayMs = isNaN(seconds) ? this.config.initialBackoffMs : seconds * 1000
    } else if (this.backoff) {
      delayMs = Math.min(
        this.backoff.currentDelayMs * this.config.backoffMultiplier,
        this.config.maxBackoffMs,
      )
    } else {
      delayMs = this.config.initialBackoffMs
    }

    this.backoff = {
      currentDelayMs: delayMs,
      retryAfter: now + delayMs,
      consecutiveHits: (this.backoff?.consecutiveHits ?? 0) + 1,
    }
  }

  /**
   * Сбрасывает backoff после успешного запроса.
   */
  handleSuccess(): void {
    this.backoff = null
  }

  /**
   * Возвращает количество последовательных 429 ответов.
   */
  getConsecutiveHits(): number {
    return this.backoff?.consecutiveHits ?? 0
  }

  /**
   * Полный сброс состояния (для тестов).
   */
  reset(): void {
    this.timestamps = []
    this.backoff = null
  }

  /** Удаляет записи за пределами окна */
  private cleanup(now: number): void {
    const cutoff = now - this.config.windowMs
    while (this.timestamps.length > 0 && this.timestamps[0] <= cutoff) {
      this.timestamps.shift()
    }
  }
}

/** Глобальный экземпляр rate limiter */
let globalLimiter: ClientRateLimiter | null = null

/**
 * Возвращает глобальный экземпляр ClientRateLimiter.
 * Создаёт при первом вызове.
 */
export function getRateLimiter(): ClientRateLimiter {
  if (!globalLimiter) {
    globalLimiter = new ClientRateLimiter()
  }
  return globalLimiter
}

/**
 * Сбрасывает глобальный rate limiter (для тестов).
 */
export function resetRateLimiter(): void {
  globalLimiter?.reset()
  globalLimiter = null
}
