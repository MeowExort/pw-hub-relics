/**
 * HTTP-клиент для взаимодействия с API.
 * Все запросы проксируются через BFF (/api/*).
 * Поддерживает автоматическое обновление JWT при 401.
 */

import { getAccessToken, refreshAccessToken } from './auth'
import { getFingerprint } from '@/shared/security/fingerprint'

/** Ошибка API с кодом статуса */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Базовые параметры запроса */
interface RequestOptions {
  params?: Record<string, any>
  body?: unknown
  signal?: AbortSignal
  /** Пропустить автоматический refresh при 401 */
  skipAuth?: boolean
  /** Дополнительные заголовки запроса */
  headers?: Record<string, string>
}

/**
 * Сериализация параметров запроса в строку URL.
 * Поддерживает массивы и вложенные объекты.
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()

  const appendParam = (key: string, value: any) => {
    if (value === undefined || value === null) return

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (typeof item === 'object' && item !== null) {
          // Для массивов объектов (например, AttributeFilterDto[])
          Object.entries(item).forEach(([prop, val]) => {
            if (val !== undefined && val !== null) {
              searchParams.append(`${key}[${value.indexOf(item)}].${prop}`, String(val))
            }
          })
        } else {
          searchParams.append(key, String(item))
        }
      })
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([prop, val]) => {
        if (val !== undefined && val !== null) {
          searchParams.append(`${key}.${prop}`, String(val))
        }
      })
    } else {
      searchParams.append(key, String(value))
    }
  }

  for (const [key, value] of Object.entries(params)) {
    appendParam(key, value)
  }

  const result = searchParams.toString()
  return result ? `?${result}` : ''
}

/**
 * Формирование заголовков запроса.
 * Включает JWT-токен и fingerprint устройства.
 */
function buildHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const token = getAccessToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Fingerprint устройства для валидации клиента
  headers['X-Client-FP'] = getFingerprint()

  // API Key для авторизации запросов
  const apiKey = import.meta.env.VITE_API_KEY
  if (apiKey) {
    headers['X-Api-Key'] = apiKey
  }

  return headers
}

/** Обработка ответа API */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text().catch(() => 'Неизвестная ошибка')
    throw new ApiError(response.status, message)
  }

  // Пустой ответ (204 No Content)
  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

/**
 * Выполняет fetch-запрос с автоматическим обновлением токена при 401.
 * Если первый запрос возвращает 401, пытается обновить токен и повторить запрос.
 */
async function fetchWithAuth(
  url: string,
  init: RequestInit,
  skipAuth?: boolean,
): Promise<Response> {
  const response = await fetch(url, init)

  // Если не 401 или auth пропущен — возвращаем как есть
  if (response.status !== 401 || skipAuth) {
    return response
  }

  // Пытаемся обновить токен
  const tokens = await refreshAccessToken()
  if (!tokens) {
    // Refresh не удался — возвращаем оригинальный 401
    return response
  }

  // Повторяем запрос с новым токеном
  const newHeaders = { ...Object.fromEntries(new Headers(init.headers).entries()) }
  newHeaders['Authorization'] = `Bearer ${tokens.access_token}`

  return fetch(url, { ...init, headers: newHeaders })
}

/** GET-запрос */
export async function get<T>(url: string, options?: RequestOptions): Promise<T> {
  const query = options?.params ? buildQueryString(options.params) : ''
  const response = await fetchWithAuth(
    `${url}${query}`,
    {
      method: 'GET',
      headers: buildHeaders(),
      signal: options?.signal,
    },
    options?.skipAuth,
  )
  return handleResponse<T>(response)
}

/** POST-запрос */
export async function post<T>(url: string, options?: RequestOptions): Promise<T> {
  const response = await fetchWithAuth(
    url,
    {
      method: 'POST',
      headers: { ...buildHeaders(), ...options?.headers },
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: options?.signal,
    },
    options?.skipAuth,
  )
  return handleResponse<T>(response)
}

/** PUT-запрос */
export async function put<T>(url: string, options?: RequestOptions): Promise<T> {
  const response = await fetchWithAuth(
    url,
    {
      method: 'PUT',
      headers: buildHeaders(),
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: options?.signal,
    },
    options?.skipAuth,
  )
  return handleResponse<T>(response)
}

/** DELETE-запрос */
export async function del<T>(url: string, options?: RequestOptions): Promise<T> {
  const response = await fetchWithAuth(
    url,
    {
      method: 'DELETE',
      headers: buildHeaders(),
      signal: options?.signal,
    },
    options?.skipAuth,
  )
  return handleResponse<T>(response)
}

// Реэкспорт для обратной совместимости
export { clearTokens, getAccessToken, isAuthenticated } from './auth'
