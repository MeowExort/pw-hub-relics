/**
 * Модуль подписи запросов к BFF-прокси.
 * Каждый запрос подписывается HMAC-SHA256 для защиты от подделки.
 */

import { hmacSha256, generateNonce } from './crypto'
import { getFingerprint } from './fingerprint'
import type { ApiAction } from './actions'
import { getActionId } from './actions'

/** Секрет для подписи (подставляется Vite define при сборке) */
const SIGNING_SECRET: string = __SIGNING_SECRET__

/** Допустимое окно валидности timestamp (±30 секунд) */
export const TIMESTAMP_WINDOW_MS = 30_000

/** Структура подписанного запроса к BFF-прокси */
export interface SignedProxyRequest {
  [key: string]: unknown
  /** Обфусцированный идентификатор действия */
  action: string
  /** JSON-строка с параметрами запроса */
  payload: string
  /** HMAC-SHA256 подпись */
  signature: string
  /** Временная метка (Unix ms) */
  timestamp: number
  /** Одноразовый токен */
  nonce: string
}

/**
 * Создаёт подписанный запрос для отправки через BFF-прокси.
 * @param action — имя действия API
 * @param params — параметры запроса (будут сериализованы в JSON)
 * @returns подписанный объект запроса
 */
export async function createSignedRequest(
  action: ApiAction,
  params: Record<string, unknown> = {},
): Promise<SignedProxyRequest> {
  const actionId = getActionId(action)
  const payload = JSON.stringify(params)
  const timestamp = Date.now()
  const nonce = generateNonce()
  const fingerprint = getFingerprint()

  // Формируем строку для подписи: action + payload + timestamp + nonce + fingerprint
  const signatureInput = `${actionId}:${payload}:${timestamp}:${nonce}:${fingerprint}`
  const signature = await hmacSha256(signatureInput, SIGNING_SECRET)

  return {
    action: actionId,
    payload,
    signature,
    timestamp,
    nonce,
  }
}
