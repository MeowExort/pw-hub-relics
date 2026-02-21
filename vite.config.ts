import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import type { IncomingMessage, ServerResponse } from 'http'

/**
 * Загружает переменные окружения из .env файла.
 * Простой парсер без зависимости от dotenv.
 */
function loadDotEnv(): Record<string, string> {
  const env: Record<string, string> = {}
  try {
    const content = readFileSync(path.resolve(__dirname, '.env'), 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex === -1) continue
      const key = trimmed.slice(0, eqIndex).trim()
      const value = trimmed.slice(eqIndex + 1).trim()
      env[key] = value
    }
  } catch {
    // .env файл не найден — не критично
  }
  return env
}

const dotEnv = loadDotEnv()

/**
 * Генерирует короткий хеш для обфускации идентификатора действия API.
 * Использует текущее время билда как соль — хеши меняются при каждой сборке.
 */
const buildSalt = dotEnv.BUILD_SALT || process.env.BUILD_SALT || Date.now().toString(36)

// --- Rate Limiting (серверная сторона BFF) ---

/** Конфигурация лимитов запросов */
const RATE_LIMITS = {
  /** Лимит на IP: запросов в минуту */
  ipPerMinute: 60,
  /** Лимит на fingerprint: запросов в минуту */
  fpPerMinute: 100,
  /** Лимит на поиск (searchRelics): запросов в минуту */
  searchPerMinute: 20,
  /** Максимальный burst (запросов в секунду) */
  burstPerSecond: 10,
  /** Размер окна в миллисекундах (1 минута) */
  windowMs: 60_000,
  /** Размер окна burst в миллисекундах (1 секунда) */
  burstWindowMs: 1_000,
  /** Порог прогрессивного замедления (80% от лимита) */
  slowdownThreshold: 0.8,
  /** Максимальная искусственная задержка при замедлении (мс) */
  maxSlowdownMs: 2_000,
} as const

/** Хранилище записей rate limiting */
interface RateLimitBucket {
  timestamps: number[]
}

/** Серверный rate limiter для BFF-прокси */
class ServerRateLimiter {
  private ipBuckets = new Map<string, RateLimitBucket>()
  private fpBuckets = new Map<string, RateLimitBucket>()
  private searchBuckets = new Map<string, RateLimitBucket>()
  private burstBuckets = new Map<string, RateLimitBucket>()

  /** Периодическая очистка устаревших записей */
  private cleanupInterval: ReturnType<typeof setInterval>

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 30_000)
  }

  /**
   * Проверяет лимиты и возвращает результат.
   * @returns null если запрос разрешён, иначе — объект с информацией о лимите
   */
  check(ip: string, fingerprint: string | undefined, isSearch: boolean): {
    limited: boolean
    retryAfterSec: number
    slowdownMs: number
    captchaRequired: boolean
  } {
    const now = Date.now()

    // 1. Проверка burst (запросов в секунду)
    const burstCount = this.countInWindow(this.getBucket(this.burstBuckets, ip), now, RATE_LIMITS.burstWindowMs)
    if (burstCount >= RATE_LIMITS.burstPerSecond) {
      return { limited: true, retryAfterSec: 1, slowdownMs: 0, captchaRequired: false }
    }

    // 2. Проверка лимита на IP
    const ipCount = this.countInWindow(this.getBucket(this.ipBuckets, ip), now, RATE_LIMITS.windowMs)
    if (ipCount >= RATE_LIMITS.ipPerMinute) {
      const retryAfter = this.calcRetryAfter(this.getBucket(this.ipBuckets, ip), now, RATE_LIMITS.windowMs)
      return { limited: true, retryAfterSec: retryAfter, slowdownMs: 0, captchaRequired: false }
    }

    // 3. Проверка лимита на fingerprint
    if (fingerprint) {
      const fpCount = this.countInWindow(this.getBucket(this.fpBuckets, fingerprint), now, RATE_LIMITS.windowMs)
      if (fpCount >= RATE_LIMITS.fpPerMinute) {
        const retryAfter = this.calcRetryAfter(this.getBucket(this.fpBuckets, fingerprint), now, RATE_LIMITS.windowMs)
        return { limited: true, retryAfterSec: retryAfter, slowdownMs: 0, captchaRequired: false }
      }
    }

    // 4. Проверка лимита на поиск
    if (isSearch) {
      const searchKey = fingerprint || ip
      const searchCount = this.countInWindow(this.getBucket(this.searchBuckets, searchKey), now, RATE_LIMITS.windowMs)
      const searchRatio = searchCount / RATE_LIMITS.searchPerMinute
      if (searchCount >= RATE_LIMITS.searchPerMinute) {
        const retryAfter = this.calcRetryAfter(this.getBucket(this.searchBuckets, searchKey), now, RATE_LIMITS.windowMs)
        return { limited: true, retryAfterSec: retryAfter, slowdownMs: 0, captchaRequired: false }
      }
      // CAPTCHA при 90%+ от лимита поиска
      if (searchRatio >= 0.9) {
        return { limited: false, retryAfterSec: 0, slowdownMs: 0, captchaRequired: true }
      }
    }

    // 5. Прогрессивное замедление (80%+ от лимита IP)
    let slowdownMs = 0
    let captchaRequired = false
    const ipRatio = ipCount / RATE_LIMITS.ipPerMinute
    if (ipRatio >= RATE_LIMITS.slowdownThreshold) {
      const overThreshold = (ipRatio - RATE_LIMITS.slowdownThreshold) / (1 - RATE_LIMITS.slowdownThreshold)
      slowdownMs = Math.round(overThreshold * RATE_LIMITS.maxSlowdownMs)
    }

    // 6. CAPTCHA при 90%+ от лимита IP
    if (ipRatio >= 0.9) {
      captchaRequired = true
    }

    return { limited: false, retryAfterSec: 0, slowdownMs, captchaRequired }
  }

  /**
   * Регистрирует запрос во всех соответствующих бакетах.
   */
  record(ip: string, fingerprint: string | undefined, isSearch: boolean): void {
    const now = Date.now()
    this.getBucket(this.burstBuckets, ip).timestamps.push(now)
    this.getBucket(this.ipBuckets, ip).timestamps.push(now)
    if (fingerprint) {
      this.getBucket(this.fpBuckets, fingerprint).timestamps.push(now)
    }
    if (isSearch) {
      const searchKey = fingerprint || ip
      this.getBucket(this.searchBuckets, searchKey).timestamps.push(now)
    }
  }

  /** Получает или создаёт бакет */
  private getBucket(map: Map<string, RateLimitBucket>, key: string): RateLimitBucket {
    let bucket = map.get(key)
    if (!bucket) {
      bucket = { timestamps: [] }
      map.set(key, bucket)
    }
    return bucket
  }

  /** Считает запросы в окне */
  private countInWindow(bucket: RateLimitBucket, now: number, windowMs: number): number {
    const cutoff = now - windowMs
    return bucket.timestamps.filter(t => t > cutoff).length
  }

  /** Вычисляет Retry-After в секундах */
  private calcRetryAfter(bucket: RateLimitBucket, now: number, windowMs: number): number {
    const cutoff = now - windowMs
    const oldest = bucket.timestamps.find(t => t > cutoff)
    if (!oldest) return 1
    return Math.max(1, Math.ceil((oldest + windowMs - now) / 1000))
  }

  /** Очистка устаревших записей */
  private cleanup(): void {
    const now = Date.now()
    const cleanBuckets = (map: Map<string, RateLimitBucket>, windowMs: number) => {
      for (const [key, bucket] of map.entries()) {
        const cutoff = now - windowMs
        bucket.timestamps = bucket.timestamps.filter(t => t > cutoff)
        if (bucket.timestamps.length === 0) {
          map.delete(key)
        }
      }
    }
    cleanBuckets(this.ipBuckets, RATE_LIMITS.windowMs)
    cleanBuckets(this.fpBuckets, RATE_LIMITS.windowMs)
    cleanBuckets(this.searchBuckets, RATE_LIMITS.windowMs)
    cleanBuckets(this.burstBuckets, RATE_LIMITS.burstWindowMs)
  }

  /** Остановка таймера очистки (для тестов) */
  destroy(): void {
    clearInterval(this.cleanupInterval)
  }
}

/** Извлекает IP-адрес клиента из запроса */
function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.socket.remoteAddress || '127.0.0.1'
}

function actionHash(name: string): string {
  return createHash('md5')
    .update(`${name}:${buildSalt}`)
    .digest('base64url')
    .slice(0, 8)
}

/** Секрет для подписи запросов (из .env или генерируется при каждом билде) */
const signingSecret = dotEnv.SIGNING_SECRET || process.env.SIGNING_SECRET || createHash('sha256')
  .update(`signing:${buildSalt}:${Math.random()}`)
  .digest('hex')
  .slice(0, 32)

/**
 * Валидация токена CAPTCHA через hCaptcha API.
 * @param token — токен от клиента
 * @param ip — IP-адрес клиента
 * @param secret — серверный секрет hCaptcha
 * @returns true если токен валиден
 */
async function verifyCaptcha(token: string, ip: string, secret: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: token,
        remoteip: ip,
      }),
    })
    const data = await response.json() as { success: boolean }
    return data.success === true
  } catch (error) {
    console.error('[BFF Proxy] Ошибка валидации CAPTCHA:', error)
    return false
  }
}

// --- Proof-of-Work (серверная сторона BFF) ---

/** Сложность PoW (количество ведущих нулей в hex SHA-256) */
const POW_DIFFICULTY = 3

/** Время жизни challenge (5 минут) */
const POW_CHALLENGE_TTL_MS = 5 * 60_000

/** Хранилище выданных challenge */
const powChallenges = new Map<string, { createdAt: number; ip: string }>()

/** Периодическая очистка просроченных challenge (только в dev-режиме, запускается в bffProxyPlugin) */
let powCleanupStarted = false
function startPowCleanup(): void {
  if (powCleanupStarted) return
  powCleanupStarted = true
  setInterval(() => {
    const now = Date.now()
    for (const [key, val] of powChallenges.entries()) {
      if (now - val.createdAt > POW_CHALLENGE_TTL_MS) {
        powChallenges.delete(key)
      }
    }
  }, 60_000)
}

/**
 * Серверная верификация PoW-решения.
 * Использует Node.js crypto (не Web Crypto API).
 */
async function serverVerifyPow(challenge: string, nonce: string, difficulty: number): Promise<boolean> {
  if (!challenge || !nonce) return false
  const prefix = '0'.repeat(difficulty)
  const hash = createHash('sha256').update(`${challenge}:${nonce}`).digest('hex')
  return hash.startsWith(prefix)
}

/** Целевой API-сервер */
const API_TARGET = 'https://api.relics.pw-hub.ru'

/**
 * Маппинг обфусцированных хешей → реальные маршруты API.
 * Строится на основе тех же хешей, что подставляются в клиентский код.
 */
interface RouteInfo {
  method: string
  path: string
}

const ACTION_ROUTE_MAP: Record<string, RouteInfo> = {
  [actionHash('searchRelics')]: { method: 'GET', path: '/api/relics/search' },
  [actionHash('getRelicById')]: { method: 'GET', path: '/api/relics/:id' },
  [actionHash('getServers')]: { method: 'GET', path: '/api/dictionaries/servers' },
  [actionHash('getSlotTypes')]: { method: 'GET', path: '/api/dictionaries/slot-types' },
  [actionHash('getAttributes')]: { method: 'GET', path: '/api/dictionaries/attributes' },
  [actionHash('getRelicDefinitions')]: { method: 'GET', path: '/api/dictionaries/relic-definitions' },
  [actionHash('getEnhancementCurve')]: { method: 'GET', path: '/api/dictionaries/enhancement-curve' },
  [actionHash('getNotificationFilters')]: { method: 'GET', path: '/api/notifications/filters' },
  [actionHash('createNotificationFilter')]: { method: 'POST', path: '/api/notifications/filters' },
  [actionHash('deleteNotificationFilter')]: { method: 'DELETE', path: '/api/notifications/filters/:id' },
  [actionHash('generateTelegramLink')]: { method: 'POST', path: '/api/telegram/binding/generate-link' },
  [actionHash('getPriceTrends')]: { method: 'GET', path: '/api/analytics/price-trends' },
}

/**
 * Считывает тело HTTP-запроса целиком.
 */
function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk: Buffer) => { data += chunk.toString() })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

/**
 * Подставляет параметры из payload в path-шаблон (например, :id).
 * Возвращает итоговый путь и оставшиеся параметры (не использованные в path).
 */
function resolvePathParams(
  pathTemplate: string,
  params: Record<string, unknown>,
): { resolvedPath: string; remainingParams: Record<string, unknown> } {
  const remaining = { ...params }
  const resolvedPath = pathTemplate.replace(/:(\w+)/g, (_, key) => {
    const value = remaining[key]
    delete remaining[key]
    return value != null ? String(value) : ''
  })
  return { resolvedPath, remainingParams: remaining }
}

/**
 * Формирует query string из параметров (для GET-запросов).
 * Пропускает undefined/null значения.
 */
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          Object.entries(item as Record<string, unknown>).forEach(([prop, val]) => {
            if (val != null) searchParams.append(`${key}[${index}].${prop}`, String(val))
          })
        } else {
          searchParams.append(key, String(item))
        }
      })
    } else {
      searchParams.append(key, String(value))
    }
  }
  const result = searchParams.toString()
  return result ? `?${result}` : ''
}

/**
 * Vite-плагин: BFF-прокси middleware.
 * Перехватывает POST /api/proxy, декодирует подписанный запрос,
 * определяет реальный эндпоинт и проксирует на бэкенд.
 */
/** Хеш действия searchRelics для определения поисковых запросов */
const SEARCH_ACTION_HASH = actionHash('searchRelics')

function bffProxyPlugin(): Plugin {
  const rateLimiter = new ServerRateLimiter()
  /** Секрет hCaptcha из .env или переменных окружения */
  const hcaptchaSecret = dotEnv.HCAPTCHA_SECRET || process.env.HCAPTCHA_SECRET || ''

  return {
    name: 'bff-proxy',
    configureServer(server) {
      // Запускаем очистку просроченных PoW-challenge
      startPowCleanup()

      // --- Эндпоинт выдачи PoW-challenge ---
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        if (req.method !== 'GET' || req.url !== '/api/pow-challenge') {
          return next()
        }

        const clientIp = getClientIp(req)
        const challenge = createHash('sha256')
          .update(`${clientIp}:${Date.now()}:${Math.random()}`)
          .digest('hex')
          .slice(0, 32)

        powChallenges.set(challenge, { createdAt: Date.now(), ip: clientIp })
        console.log(`[BFF PoW] Выдан challenge=${challenge.slice(0, 8)}... для IP=${clientIp}`)

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ challenge, difficulty: POW_DIFFICULTY }))
      })

      // --- Основной BFF-прокси ---
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        // Перехватываем только POST /api/proxy
        if (req.method !== 'POST' || req.url !== '/api/proxy') {
          return next()
        }

        try {
          console.log(`[BFF Proxy] ← POST /api/proxy`)
          const rawBody = await readBody(req)
          const body = JSON.parse(rawBody) as {
            action: string
            payload: string
            signature: string
            timestamp: number
            nonce: string
          }

          // --- Rate Limiting ---
          const clientIp = getClientIp(req)
          const fingerprint = req.headers['x-client-fp'] as string | undefined
          const isSearch = body.action === SEARCH_ACTION_HASH

          const limitResult = rateLimiter.check(clientIp, fingerprint, isSearch)
          console.log(`[BFF Proxy] IP=${clientIp}, FP=${fingerprint || 'нет'}, action=${body.action}, search=${isSearch}`)

          if (limitResult.limited) {
            console.log(`[BFF Proxy] ⛔ Rate limit — 429 (retryAfter=${limitResult.retryAfterSec}s)`)
            res.writeHead(429, {
              'Content-Type': 'application/json',
              'Retry-After': String(limitResult.retryAfterSec),
            })
            res.end(JSON.stringify({
              error: 'Слишком много запросов',
              retryAfter: limitResult.retryAfterSec,
            }))
            return
          }

          // --- CAPTCHA ---
          // При 90%+ от лимита требуем CAPTCHA-токен
          if (limitResult.captchaRequired) {
            const captchaToken = req.headers['x-captcha-token'] as string | undefined
            console.log(`[BFF CAPTCHA] Требуется CAPTCHA для IP=${clientIp}, FP=${fingerprint || 'нет'}, токен=${captchaToken ? 'есть' : 'отсутствует'}`)

            if (!captchaToken) {
              console.log(`[BFF CAPTCHA] ❌ Токен не предоставлен — отклоняем запрос (403)`)
              res.writeHead(403, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({
                error: 'Требуется CAPTCHA',
                captchaRequired: true,
              }))
              return
            }

            // Валидация токена через hCaptcha API
            if (!hcaptchaSecret) {
              console.warn('[BFF CAPTCHA] ⚠️ HCAPTCHA_SECRET не задан — токен не валидируется, пропускаем')
            } else {
              console.log(`[BFF CAPTCHA] Валидация токена через hCaptcha API...`)
              const isValid = await verifyCaptcha(captchaToken, clientIp, hcaptchaSecret)
              if (isValid) {
                console.log(`[BFF CAPTCHA] ✅ Токен валиден — запрос пропущен`)
              } else {
                console.log(`[BFF CAPTCHA] ❌ Токен невалиден — отклоняем запрос (403)`)
                res.writeHead(403, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({
                  error: 'Невалидный CAPTCHA-токен',
                  captchaRequired: true,
                }))
                return
              }
            }
          }

          // --- Proof-of-Work ---
          const powChallenge = req.headers['x-pow-challenge'] as string | undefined
          const powNonce = req.headers['x-pow-nonce'] as string | undefined

          if (!powChallenge || !powNonce) {
            console.log(`[BFF PoW] ❌ PoW-заголовки отсутствуют — отклоняем запрос (403)`)
            res.writeHead(403, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Требуется Proof-of-Work', powRequired: true }))
            return
          }

          // Проверяем, что challenge был выдан сервером
          const challengeRecord = powChallenges.get(powChallenge)
          if (!challengeRecord) {
            console.log(`[BFF PoW] ❌ Неизвестный challenge — отклоняем запрос (403)`)
            res.writeHead(403, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Невалидный PoW challenge', powRequired: true }))
            return
          }

          // Проверяем TTL
          if (Date.now() - challengeRecord.createdAt > POW_CHALLENGE_TTL_MS) {
            powChallenges.delete(powChallenge)
            console.log(`[BFF PoW] ❌ Challenge просрочен — отклоняем запрос (403)`)
            res.writeHead(403, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'PoW challenge просрочен', powRequired: true }))
            return
          }

          // Верифицируем решение
          const powValid = await serverVerifyPow(powChallenge, powNonce, POW_DIFFICULTY)
          if (!powValid) {
            console.log(`[BFF PoW] ❌ Неверное решение — отклоняем запрос (403)`)
            res.writeHead(403, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Неверное PoW-решение', powRequired: true }))
            return
          }

          // Challenge использован — удаляем (одноразовый)
          powChallenges.delete(powChallenge)
          console.log(`[BFF PoW] ✅ PoW верифицирован (challenge=${powChallenge.slice(0, 8)}...)`)

          // Прогрессивное замедление при приближении к лимиту
          if (limitResult.slowdownMs > 0) {
            await new Promise(resolve => setTimeout(resolve, limitResult.slowdownMs))
          }

          // Регистрируем запрос
          rateLimiter.record(clientIp, fingerprint, isSearch)

          // Находим реальный маршрут по обфусцированному action
          const route = ACTION_ROUTE_MAP[body.action]
          if (!route) {
            console.log(`[BFF Proxy] ❌ Неизвестное действие: ${body.action}`)
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Неизвестное действие' }))
            return
          }

          // Парсим payload
          const params: Record<string, unknown> = body.payload ? JSON.parse(body.payload) : {}

          // Подставляем path-параметры (:id и т.д.)
          const { resolvedPath, remainingParams } = resolvePathParams(route.path, params)

          // Формируем URL для реального запроса
          const targetUrl = `${API_TARGET}${resolvedPath}`
          let finalTargetUrl = targetUrl
          const fetchOptions: RequestInit = {
            method: route.method,
            headers: {
              'Content-Type': 'application/json',
              // Пробрасываем API Key для авторизации на бекенде
              ...(dotEnv.VITE_API_KEY ? { 'X-Api-Key': dotEnv.VITE_API_KEY } : {}),
              // Пробрасываем авторизацию, если есть
              ...(req.headers.authorization ? { Authorization: req.headers.authorization as string } : {}),
            },
          }

          if (route.method === 'GET') {
            // Параметры в query string
            finalTargetUrl = targetUrl + buildQueryString(remainingParams)
          } else if (route.method === 'POST' || route.method === 'PUT') {
            // Параметры в теле запроса
            fetchOptions.body = JSON.stringify(remainingParams)
          }
          // DELETE — без тела (параметры уже в path)

          console.log(`[BFF Proxy] → ${route.method} ${finalTargetUrl}`)
          const apiResponse = await fetch(finalTargetUrl, fetchOptions)

          // Пробрасываем статус и заголовки
          res.writeHead(apiResponse.status, {
            'Content-Type': apiResponse.headers.get('content-type') || 'application/json',
          })

          // Пробрасываем тело ответа
          const responseBody = await apiResponse.text()
          console.log(`[BFF Proxy] ✅ ${apiResponse.status} (${responseBody.length} bytes)`)
          res.end(responseBody)
        } catch (error) {
          console.error('[BFF Proxy] Ошибка:', error)
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ error: 'Внутренняя ошибка прокси' }))
        }
      })
    },
  }
}

/** User-Agent паттерны ботов мессенджеров */
const BOT_UA_PATTERN = /TelegramBot|Twitterbot|Discordbot|facebookexternalhit|LinkedInBot|Slackbot|vkShare|WhatsApp/i

/**
 * Vite-плагин: OG-теги для ботов мессенджеров.
 * Перехватывает запросы к /relics/:id от ботов и возвращает HTML с мета-тегами.
 */
function ogTagsPlugin(): Plugin {
  return {
    name: 'og-tags',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url || ''
        const match = url.match(/^\/relics\/([a-f0-9-]+)/i)
        if (!match) return next()

        const ua = req.headers['user-agent'] || ''
        if (!BOT_UA_PATTERN.test(ua)) return next()

        const relicId = match[1]
        try {
          const apiRes = await fetch(`${API_TARGET}/api/relics/${relicId}`)
          if (!apiRes.ok) return next()

          const relic = await apiRes.json() as any
          const def = relic.relicDefinition
          const title = `${def.name}${relic.enhancementLevel > 0 ? ` +${relic.enhancementLevel}` : ''}`
          const descParts = [
            `Цена: ${relic.priceFormatted}`,
            `Сервер: ${relic.server.name}`,
            `${relic.mainAttribute.attributeDefinition.name}: ${relic.mainAttribute.value}`,
            ...relic.additionalAttributes.map(
              (a: any) => `${a.attributeDefinition.name}: ${a.value}`,
            ),
          ]
          const description = descParts.join(' · ')

          const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>${title} — PW Hub Relics</title>
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://relics.pw-hub.ru/relics/${relicId}" />
  ${def.iconUri ? `<meta property="og:image" content="${def.iconUri}" />` : ''}
  <meta property="og:site_name" content="PW Hub Relics" />
</head>
<body></body>
</html>`

          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(html)
        } catch {
          next()
        }
      })
    },
  }
}

/**
 * Vite-плагин: выводит BUILD_SALT и SIGNING_SECRET при сборке.
 * Эти значения нужно передать BFF-серверу через переменные окружения.
 */
function buildInfoPlugin(): Plugin {
  return {
    name: 'build-info',
    buildStart() {
      console.log(`\n[Build Info] BUILD_SALT=${buildSalt}`)
      console.log(`[Build Info] SIGNING_SECRET=${signingSecret}\n`)
    },
  }
}

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    buildInfoPlugin(),
    // ogTagsPlugin и bffProxyPlugin содержат setInterval, которые блокируют завершение процесса при сборке
    ...(command === 'serve' ? [ogTagsPlugin(), bffProxyPlugin()] : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    __ACTION_SEARCH_RELICS__: JSON.stringify(actionHash('searchRelics')),
    __ACTION_GET_RELIC_BY_ID__: JSON.stringify(actionHash('getRelicById')),
    __ACTION_GET_SERVERS__: JSON.stringify(actionHash('getServers')),
    __ACTION_GET_SLOT_TYPES__: JSON.stringify(actionHash('getSlotTypes')),
    __ACTION_GET_ATTRIBUTES__: JSON.stringify(actionHash('getAttributes')),
    __ACTION_GET_RELIC_DEFINITIONS__: JSON.stringify(actionHash('getRelicDefinitions')),
    __ACTION_GET_ENHANCEMENT_CURVE__: JSON.stringify(actionHash('getEnhancementCurve')),
    __ACTION_GET_NOTIFICATION_FILTERS__: JSON.stringify(actionHash('getNotificationFilters')),
    __ACTION_CREATE_NOTIFICATION_FILTER__: JSON.stringify(actionHash('createNotificationFilter')),
    __ACTION_DELETE_NOTIFICATION_FILTER__: JSON.stringify(actionHash('deleteNotificationFilter')),
    __ACTION_GENERATE_TELEGRAM_LINK__: JSON.stringify(actionHash('generateTelegramLink')),
    __ACTION_GET_PRICE_TRENDS__: JSON.stringify(actionHash('getPriceTrends')),
    __SIGNING_SECRET__: JSON.stringify(signingSecret),
  },
  server: {
    host: '0.0.0.0',
    proxy: {
      // Прямое проксирование для запросов, не идущих через BFF (например, auth)
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
}))
