/**
 * Модуль криптографических утилит для подписи запросов.
 * Использует Web Crypto API (SHA-256, HMAC).
 */

/**
 * Вычисляет SHA-256 хеш строки.
 * @returns hex-строка хеша
 */
export async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Вычисляет HMAC-SHA256 подпись.
 * @param message — подписываемое сообщение
 * @param secret — секретный ключ
 * @returns hex-строка подписи
 */
export async function hmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const msgData = encoder.encode(message)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
  const sigArray = Array.from(new Uint8Array(signature))
  return sigArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Генерирует криптографически случайный nonce.
 * @returns hex-строка длиной 32 символа
 */
export function generateNonce(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
