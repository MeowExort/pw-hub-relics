/**
 * BFF-сервер для PW Hub Relics.
 * Раздаёт статику из dist/, проксирует API-запросы,
 * обеспечивает rate limiting, PoW, CAPTCHA и OG-теги для ботов.
 */

import express from 'express'
import { createHash } from 'crypto'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// --- Конфигурация ---

const PORT = parseInt(process.env.PORT || '3000', 10)
const API_TARGET = process.env.API_TARGET || 'https://api.relics.pw-hub.ru'
const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET || ''
const SITE_URL = process.env.SITE_URL || 'https://relics.pw-hub.ru'

/**
 * Соль для генерации хешей действий.
 * В production берётся из переменной окружения BUILD_SALT,
 * которая задаётся при сборке фронта (совпадает с buildSalt в vite.config.ts).
 */
const buildSalt = process.env.BUILD_SALT || Date.now().toString(36)

/** Секрет подписи запросов (должен совпадать с клиентским) */
const signingSecret = process.env.SIGNING_SECRET || ''

// --- Утилиты ---

/** Генерирует хеш действия (должен совпадать с vite.config.ts) */
function actionHash(name) {
  return createHash('md5')
    .update(`${name}:${buildSalt}`)
    .digest('base64url')
    .slice(0, 8)
}

// --- Rate Limiting ---

const RATE_LIMITS = {
  ipPerMinute: 60,
  fpPerMinute: 100,
  searchPerMinute: 20,
  burstPerSecond: 10,
  windowMs: 60_000,
  burstWindowMs: 1_000,
  slowdownThreshold: 0.8,
  maxSlowdownMs: 2_000,
}

class ServerRateLimiter {
  constructor() {
    this.ipBuckets = new Map()
    this.fpBuckets = new Map()
    this.searchBuckets = new Map()
    this.burstBuckets = new Map()
    this.cleanupInterval = setInterval(() => this.cleanup(), 30_000)
  }

  check(ip, fingerprint, isSearch) {
    const now = Date.now()

    const burstCount = this.countInWindow(this.getBucket(this.burstBuckets, ip), now, RATE_LIMITS.burstWindowMs)
    if (burstCount >= RATE_LIMITS.burstPerSecond) {
      return { limited: true, retryAfterSec: 1, slowdownMs: 0, captchaRequired: false }
    }

    const ipCount = this.countInWindow(this.getBucket(this.ipBuckets, ip), now, RATE_LIMITS.windowMs)
    if (ipCount >= RATE_LIMITS.ipPerMinute) {
      const retryAfter = this.calcRetryAfter(this.getBucket(this.ipBuckets, ip), now, RATE_LIMITS.windowMs)
      return { limited: true, retryAfterSec: retryAfter, slowdownMs: 0, captchaRequired: false }
    }

    if (fingerprint) {
      const fpCount = this.countInWindow(this.getBucket(this.fpBuckets, fingerprint), now, RATE_LIMITS.windowMs)
      if (fpCount >= RATE_LIMITS.fpPerMinute) {
        const retryAfter = this.calcRetryAfter(this.getBucket(this.fpBuckets, fingerprint), now, RATE_LIMITS.windowMs)
        return { limited: true, retryAfterSec: retryAfter, slowdownMs: 0, captchaRequired: false }
      }
    }

    if (isSearch) {
      const searchKey = fingerprint || ip
      const searchCount = this.countInWindow(this.getBucket(this.searchBuckets, searchKey), now, RATE_LIMITS.windowMs)
      const searchRatio = searchCount / RATE_LIMITS.searchPerMinute
      if (searchCount >= RATE_LIMITS.searchPerMinute) {
        const retryAfter = this.calcRetryAfter(this.getBucket(this.searchBuckets, searchKey), now, RATE_LIMITS.windowMs)
        return { limited: true, retryAfterSec: retryAfter, slowdownMs: 0, captchaRequired: false }
      }
      if (searchRatio >= 0.9) {
        return { limited: false, retryAfterSec: 0, slowdownMs: 0, captchaRequired: true }
      }
    }

    let slowdownMs = 0
    let captchaRequired = false
    const ipRatio = ipCount / RATE_LIMITS.ipPerMinute
    if (ipRatio >= RATE_LIMITS.slowdownThreshold) {
      const overThreshold = (ipRatio - RATE_LIMITS.slowdownThreshold) / (1 - RATE_LIMITS.slowdownThreshold)
      slowdownMs = Math.round(overThreshold * RATE_LIMITS.maxSlowdownMs)
    }
    if (ipRatio >= 0.9) {
      captchaRequired = true
    }

    return { limited: false, retryAfterSec: 0, slowdownMs, captchaRequired }
  }

  record(ip, fingerprint, isSearch) {
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

  getBucket(map, key) {
    let bucket = map.get(key)
    if (!bucket) {
      bucket = { timestamps: [] }
      map.set(key, bucket)
    }
    return bucket
  }

  countInWindow(bucket, now, windowMs) {
    const cutoff = now - windowMs
    return bucket.timestamps.filter(t => t > cutoff).length
  }

  calcRetryAfter(bucket, now, windowMs) {
    const cutoff = now - windowMs
    const oldest = bucket.timestamps.find(t => t > cutoff)
    if (!oldest) return 1
    return Math.max(1, Math.ceil((oldest + windowMs - now) / 1000))
  }

  cleanup() {
    const now = Date.now()
    const cleanBuckets = (map, windowMs) => {
      for (const [key, bucket] of map.entries()) {
        const cutoff = now - windowMs
        bucket.timestamps = bucket.timestamps.filter(t => t > cutoff)
        if (bucket.timestamps.length === 0) map.delete(key)
      }
    }
    cleanBuckets(this.ipBuckets, RATE_LIMITS.windowMs)
    cleanBuckets(this.fpBuckets, RATE_LIMITS.windowMs)
    cleanBuckets(this.searchBuckets, RATE_LIMITS.windowMs)
    cleanBuckets(this.burstBuckets, RATE_LIMITS.burstWindowMs)
  }
}

// --- Proof-of-Work ---

const POW_DIFFICULTY = 3
const POW_CHALLENGE_TTL_MS = 5 * 60_000
const powChallenges = new Map()

setInterval(() => {
  const now = Date.now()
  for (const [key, val] of powChallenges.entries()) {
    if (now - val.createdAt > POW_CHALLENGE_TTL_MS) powChallenges.delete(key)
  }
}, 60_000)

function serverVerifyPow(challenge, nonce, difficulty) {
  if (!challenge || !nonce) return false
  const prefix = '0'.repeat(difficulty)
  const hash = createHash('sha256').update(`${challenge}:${nonce}`).digest('hex')
  return hash.startsWith(prefix)
}

// --- CAPTCHA ---

async function verifyCaptcha(token, ip, secret) {
  try {
    const response = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    })
    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error('[BFF] Ошибка валидации CAPTCHA:', error)
    return false
  }
}

// --- Маршруты API ---

const SEARCH_ACTION_HASH = actionHash('searchRelics')

const ACTION_ROUTE_MAP = {
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
}

// --- Утилиты маршрутизации ---

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim()
  return req.ip || req.socket.remoteAddress || '127.0.0.1'
}

function resolvePathParams(pathTemplate, params) {
  const remaining = { ...params }
  const resolvedPath = pathTemplate.replace(/:(\w+)/g, (_, key) => {
    const value = remaining[key]
    delete remaining[key]
    return value != null ? String(value) : ''
  })
  return { resolvedPath, remainingParams: remaining }
}

function buildQueryString(params) {
  const searchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === 'object' && item !== null) {
          Object.entries(item).forEach(([prop, val]) => {
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

// --- OG-теги ---

const BOT_UA_PATTERN = /TelegramBot|Twitterbot|Discordbot|facebookexternalhit|LinkedInBot|Slackbot|vkShare|WhatsApp/i

/** Экранирование HTML-атрибутов */
function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// --- Express-приложение ---

const app = express()
const rateLimiter = new ServerRateLimiter()

// Доверяем прокси (для корректного req.ip за nginx)
app.set('trust proxy', true)

// Парсинг JSON-тела
app.use(express.json())

// --- PoW Challenge ---
app.get('/api/pow-challenge', (req, res) => {
  const clientIp = getClientIp(req)
  const challenge = createHash('sha256')
    .update(`${clientIp}:${Date.now()}:${Math.random()}`)
    .digest('hex')
    .slice(0, 32)

  powChallenges.set(challenge, { createdAt: Date.now(), ip: clientIp })
  console.log(`[BFF PoW] Выдан challenge=${challenge.slice(0, 8)}... для IP=${clientIp}`)

  res.json({ challenge, difficulty: POW_DIFFICULTY })
})

// --- BFF Proxy ---
app.post('/api/proxy', async (req, res) => {
  try {
    const body = req.body
    console.log(`[BFF Proxy] ← POST /api/proxy`)

    // Rate Limiting
    const clientIp = getClientIp(req)
    const fingerprint = req.headers['x-client-fp']
    const isSearch = body.action === SEARCH_ACTION_HASH

    const limitResult = rateLimiter.check(clientIp, fingerprint, isSearch)
    console.log(`[BFF Proxy] IP=${clientIp}, FP=${fingerprint || 'нет'}, action=${body.action}, search=${isSearch}`)

    if (limitResult.limited) {
      console.log(`[BFF Proxy] ⛔ Rate limit — 429 (retryAfter=${limitResult.retryAfterSec}s)`)
      return res.status(429).set('Retry-After', String(limitResult.retryAfterSec)).json({
        error: 'Слишком много запросов',
        retryAfter: limitResult.retryAfterSec,
      })
    }

    // CAPTCHA
    if (limitResult.captchaRequired) {
      const captchaToken = req.headers['x-captcha-token']
      console.log(`[BFF CAPTCHA] Требуется CAPTCHA для IP=${clientIp}`)

      if (!captchaToken) {
        return res.status(403).json({ error: 'Требуется CAPTCHA', captchaRequired: true })
      }

      if (HCAPTCHA_SECRET) {
        const isValid = await verifyCaptcha(captchaToken, clientIp, HCAPTCHA_SECRET)
        if (!isValid) {
          return res.status(403).json({ error: 'Невалидный CAPTCHA-токен', captchaRequired: true })
        }
      }
    }

    // Proof-of-Work
    const powChallenge = req.headers['x-pow-challenge']
    const powNonce = req.headers['x-pow-nonce']

    if (!powChallenge || !powNonce) {
      return res.status(403).json({ error: 'Требуется Proof-of-Work', powRequired: true })
    }

    const challengeRecord = powChallenges.get(powChallenge)
    if (!challengeRecord) {
      return res.status(403).json({ error: 'Невалидный PoW challenge', powRequired: true })
    }

    if (Date.now() - challengeRecord.createdAt > POW_CHALLENGE_TTL_MS) {
      powChallenges.delete(powChallenge)
      return res.status(403).json({ error: 'PoW challenge просрочен', powRequired: true })
    }

    const powValid = serverVerifyPow(powChallenge, powNonce, POW_DIFFICULTY)
    if (!powValid) {
      return res.status(403).json({ error: 'Неверное PoW-решение', powRequired: true })
    }

    powChallenges.delete(powChallenge)
    console.log(`[BFF PoW] ✅ PoW верифицирован`)

    // Прогрессивное замедление
    if (limitResult.slowdownMs > 0) {
      await new Promise(resolve => setTimeout(resolve, limitResult.slowdownMs))
    }

    rateLimiter.record(clientIp, fingerprint, isSearch)

    // Маршрутизация
    const route = ACTION_ROUTE_MAP[body.action]
    if (!route) {
      console.log(`[BFF Proxy] ❌ Неизвестное действие: ${body.action}`)
      return res.status(400).json({ error: 'Неизвестное действие' })
    }

    const params = body.payload ? JSON.parse(body.payload) : {}
    const { resolvedPath, remainingParams } = resolvePathParams(route.path, params)

    let targetUrl = `${API_TARGET}${resolvedPath}`
    const fetchOptions = {
      method: route.method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}),
      },
    }

    if (route.method === 'GET') {
      targetUrl += buildQueryString(remainingParams)
    } else if (route.method === 'POST' || route.method === 'PUT') {
      fetchOptions.body = JSON.stringify(remainingParams)
    }

    console.log(`[BFF Proxy] → ${route.method} ${targetUrl}`)
    const apiResponse = await fetch(targetUrl, fetchOptions)

    const responseBody = await apiResponse.text()
    console.log(`[BFF Proxy] ✅ ${apiResponse.status} (${responseBody.length} bytes)`)

    res.status(apiResponse.status)
      .set('Content-Type', apiResponse.headers.get('content-type') || 'application/json')
      .send(responseBody)
  } catch (error) {
    console.error('[BFF Proxy] Ошибка:', error)
    res.status(500).json({ error: 'Внутренняя ошибка прокси' })
  }
})

// --- OG-теги для ботов мессенджеров ---
app.get('/relics/:id', async (req, res, next) => {
  const ua = req.headers['user-agent'] || ''
  if (!BOT_UA_PATTERN.test(ua)) return next()

  const relicId = req.params.id
  try {
    const apiRes = await fetch(`${API_TARGET}/api/relics/${relicId}`)
    if (!apiRes.ok) return next()

    const relic = await apiRes.json()
    const def = relic.relicDefinition
    const title = escapeHtml(`${def.name}${relic.enhancementLevel > 0 ? ` +${relic.enhancementLevel}` : ''}`)
    const descParts = [
      `Цена: ${relic.priceFormatted}`,
      `Сервер: ${relic.server.name}`,
      `${relic.mainAttribute.attributeDefinition.name}: ${relic.mainAttribute.value}`,
      ...relic.additionalAttributes.map(
        (a) => `${a.attributeDefinition.name}: ${a.value}`,
      ),
    ]
    const description = escapeHtml(descParts.join(' · '))

    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>${title} — PW Hub Relics</title>
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${SITE_URL}/relics/${relicId}" />
  ${def.iconUri ? `<meta property="og:image" content="${escapeHtml(def.iconUri)}" />` : ''}
  <meta property="og:site_name" content="PW Hub Relics" />
</head>
<body></body>
</html>`

    res.set('Content-Type', 'text/html; charset=utf-8').send(html)
  } catch {
    next()
  }
})

// --- Статика из dist/ ---
const distPath = path.resolve(__dirname, 'dist')
app.use(express.static(distPath))

// SPA fallback — все остальные GET-запросы отдают index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

// --- Запуск ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[BFF] Сервер запущен на http://0.0.0.0:${PORT}`)
  console.log(`[BFF] API_TARGET=${API_TARGET}`)
  console.log(`[BFF] HCAPTCHA_SECRET=${HCAPTCHA_SECRET ? 'задан' : 'не задан'}`)
  console.log(`[BFF] BUILD_SALT=${buildSalt}`)
})
