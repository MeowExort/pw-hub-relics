/**
 * API-сервис для уведомлений и подписок.
 * Все запросы проксируются через BFF.
 */
import { proxyRequest } from './proxy'
import type { CreateFilterRequest, NotificationFilter } from '@/shared/types'

/** Получение списка фильтров уведомлений */
export function getNotificationFilters(signal?: AbortSignal): Promise<NotificationFilter[]> {
  return proxyRequest<NotificationFilter[]>('getNotificationFilters', {}, signal)
}

/** Создание фильтра уведомлений */
export function createNotificationFilter(data: CreateFilterRequest): Promise<NotificationFilter> {
  return proxyRequest<NotificationFilter>('createNotificationFilter', data as unknown as Record<string, unknown>)
}

/** Удаление фильтра уведомлений */
export function deleteNotificationFilter(id: string): Promise<void> {
  return proxyRequest<void>('deleteNotificationFilter', { id })
}

/** Генерация ссылки для привязки Telegram */
export function generateTelegramLink(): Promise<{ link: string }> {
  return proxyRequest<{ link: string }>('generateTelegramLink')
}
