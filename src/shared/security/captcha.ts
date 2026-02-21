/**
 * Модуль управления CAPTCHA (hCaptcha).
 * Сервер требует CAPTCHA при подозрительной активности.
 * Клиент показывает виджет, получает токен и передаёт его в следующем запросе.
 */

/** Ключ сайта hCaptcha (публичный) */
const HCAPTCHA_SITE_KEY = 'a5000400-bdd8-4fda-8148-b26cb9fea64c'

/** Состояние CAPTCHA */
interface CaptchaState {
  /** Требуется ли CAPTCHA для следующего запроса */
  required: boolean
  /** Решённый токен CAPTCHA (если есть) */
  token: string | null
  /** Колбэк для уведомления о решении CAPTCHA */
  resolveCallback: ((token: string) => void) | null
  /** Колбэк для уведомления об отмене CAPTCHA */
  rejectCallback: ((reason: Error) => void) | null
}

const state: CaptchaState = {
  required: false,
  token: null,
  resolveCallback: null,
  rejectCallback: null,
}

/** Слушатели изменения состояния CAPTCHA */
type CaptchaListener = (required: boolean) => void
const listeners = new Set<CaptchaListener>()

/**
 * Подписка на изменение состояния CAPTCHA.
 * @returns функция отписки
 */
export function onCaptchaRequired(listener: CaptchaListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Уведомляет слушателей об изменении состояния */
function notifyListeners(): void {
  listeners.forEach(fn => fn(state.required))
}

/** Требуется ли CAPTCHA */
export function isCaptchaRequired(): boolean {
  return state.required
}

/** Получить текущий токен CAPTCHA (если решена) */
export function getCaptchaToken(): string | null {
  return state.token
}

/** Получить публичный ключ сайта hCaptcha */
export function getHcaptchaSiteKey(): string {
  return HCAPTCHA_SITE_KEY
}

/**
 * Сервер потребовал CAPTCHA — устанавливаем флаг и ждём решения.
 * Возвращает промис, который резолвится токеном после решения CAPTCHA пользователем.
 */
export function requestCaptcha(): Promise<string> {
  state.required = true
  state.token = null
  notifyListeners()

  return new Promise<string>((resolve, reject) => {
    state.resolveCallback = resolve
    state.rejectCallback = reject
  })
}

/**
 * CAPTCHA решена — сохраняем токен и уведомляем ожидающий запрос.
 * @param token — токен от hCaptcha
 */
export function solveCaptcha(token: string): void {
  state.token = token
  state.required = false
  notifyListeners()

  if (state.resolveCallback) {
    state.resolveCallback(token)
    state.resolveCallback = null
    state.rejectCallback = null
  }
}

/**
 * Пользователь отменил CAPTCHA.
 */
export function cancelCaptcha(): void {
  state.required = false
  state.token = null
  notifyListeners()

  if (state.rejectCallback) {
    state.rejectCallback(new Error('CAPTCHA отменена пользователем'))
    state.resolveCallback = null
    state.rejectCallback = null
  }
}

/**
 * Использовать токен CAPTCHA (одноразовый — после использования сбрасывается).
 * @returns токен или null
 */
export function consumeCaptchaToken(): string | null {
  const token = state.token
  state.token = null
  return token
}

/**
 * Сброс состояния CAPTCHA (для тестов).
 */
export function resetCaptchaState(): void {
  state.required = false
  state.token = null
  state.resolveCallback = null
  state.rejectCallback = null
  listeners.clear()
}
