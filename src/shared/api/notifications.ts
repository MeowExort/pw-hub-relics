/**
 * API-сервис для уведомлений и подписок.
 * Все запросы проксируются через BFF.
 */
import { proxyRequest } from './proxy'
import type {
  CreateFilterRequest,
  UpdateFilterRequest,
  ToggleFilterRequest,
  NotificationFilter,
  TelegramBindingStatus,
  NotificationSettings,
  UpdateNotificationSettingsRequest,
} from '@/shared/types'

/** Получение списка фильтров уведомлений */
export async function getNotificationFilters(signal?: AbortSignal): Promise<NotificationFilter[]> {
  const response = await proxyRequest<{ filters: NotificationFilter[] } | NotificationFilter[]>('getNotificationFilters', {}, signal)
  // API возвращает { filters: [...] }, извлекаем массив
  if (Array.isArray(response)) return response
  return response.filters ?? []
}

/** Создание фильтра уведомлений */
export function createNotificationFilter(data: CreateFilterRequest): Promise<NotificationFilter> {
  return proxyRequest<NotificationFilter>('createNotificationFilter', data as unknown as Record<string, unknown>)
}

/** Обновление фильтра уведомлений */
export function updateNotificationFilter(id: string, data: UpdateFilterRequest): Promise<NotificationFilter> {
  return proxyRequest<NotificationFilter>('updateNotificationFilter', { id, ...data } as unknown as Record<string, unknown>)
}

/** Переключение активности фильтра */
export function toggleNotificationFilter(id: string, data: ToggleFilterRequest): Promise<void> {
  return proxyRequest<void>('toggleNotificationFilter', { id, ...data } as unknown as Record<string, unknown>)
}

/** Удаление фильтра уведомлений */
export function deleteNotificationFilter(id: string): Promise<void> {
  return proxyRequest<void>('deleteNotificationFilter', { id })
}

/** Генерация ссылки для привязки Telegram */
export function generateTelegramLink(): Promise<{ deepLink: string; expiresAt: string }> {
  return proxyRequest<{ deepLink: string; expiresAt: string }>('generateTelegramLink')
}

/** Получение статуса привязки Telegram */
export function getTelegramBindingStatus(signal?: AbortSignal): Promise<TelegramBindingStatus> {
  return proxyRequest<TelegramBindingStatus>('getTelegramBindingStatus', {}, signal)
}

/** Отвязка Telegram-аккаунта */
export function deleteTelegramBinding(): Promise<void> {
  return proxyRequest<void>('deleteTelegramBinding')
}

/** Получение настроек уведомлений */
export function getNotificationSettings(signal?: AbortSignal): Promise<NotificationSettings> {
  return proxyRequest<NotificationSettings>('getNotificationSettings', {}, signal)
}

/** Обновление настроек уведомлений */
export function updateNotificationSettings(data: UpdateNotificationSettingsRequest): Promise<void> {
  return proxyRequest<void>('updateNotificationSettings', data as unknown as Record<string, unknown>)
}

/** Отправка тестового уведомления */
export function sendTestNotification(): Promise<void> {
  return proxyRequest<void>('sendTestNotification')
}
