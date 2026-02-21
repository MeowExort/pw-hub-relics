/**
 * Модуль генерации fingerprint браузера.
 * Используется для привязки сессии к устройству и защиты от ботов.
 */

/** Ключ для кэширования fingerprint в sessionStorage */
const FINGERPRINT_KEY = 'device_fingerprint'

/**
 * Генерирует хеш-строку из набора характеристик браузера.
 * Использует простой FNV-1a хеш для быстрой генерации.
 */
function fnv1aHash(str: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = (hash * 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

/**
 * Собирает характеристики браузера для формирования отпечатка.
 */
export function collectBrowserTraits(): string[] {
  const traits: string[] = []

  // User-Agent
  traits.push(navigator.userAgent)

  // Язык
  traits.push(navigator.language)

  // Часовой пояс
  traits.push(Intl.DateTimeFormat().resolvedOptions().timeZone)

  // Разрешение экрана
  traits.push(`${screen.width}x${screen.height}x${screen.colorDepth}`)

  // Платформа
  traits.push(navigator.platform)

  // Количество ядер процессора
  traits.push(String(navigator.hardwareConcurrency || 0))

  // Доступная память (если поддерживается)
  const nav = navigator as unknown as Record<string, unknown>
  if (nav.deviceMemory) {
    traits.push(String(nav.deviceMemory))
  }

  // Тачскрин
  traits.push(String(navigator.maxTouchPoints || 0))

  return traits
}

/**
 * Генерирует fingerprint устройства на основе характеристик браузера.
 * Результат кэшируется в sessionStorage на время сессии.
 */
export function getFingerprint(): string {
  const cached = sessionStorage.getItem(FINGERPRINT_KEY)
  if (cached) return cached

  const traits = collectBrowserTraits()
  const raw = traits.join('|')
  const fingerprint = fnv1aHash(raw)

  sessionStorage.setItem(FINGERPRINT_KEY, fingerprint)
  return fingerprint
}

/**
 * Сбрасывает кэшированный fingerprint.
 * Используется при необходимости пересчёта.
 */
export function resetFingerprint(): void {
  sessionStorage.removeItem(FINGERPRINT_KEY)
}
