/**
 * API-сервис для уведомлений и подписок.
 */
import { get, post, del } from './client'
import type { CreateFilterRequest, NotificationFilter } from '@/shared/types'

/** Получение списка фильтров уведомлений */
export function getNotificationFilters(signal?: AbortSignal): Promise<NotificationFilter[]> {
  return get<NotificationFilter[]>('/api/notifications/filters', { signal })
}

/** Создание фильтра уведомлений */
export function createNotificationFilter(data: CreateFilterRequest): Promise<NotificationFilter> {
  return post<NotificationFilter>('/api/notifications/filters', { body: data })
}

/** Удаление фильтра уведомлений */
export function deleteNotificationFilter(id: string): Promise<void> {
  return del<void>(`/api/notifications/filters/${id}`)
}

/** Генерация ссылки для привязки Telegram */
export function generateTelegramLink(): Promise<{ link: string }> {
  return post<{ link: string }>('/api/telegram/binding/generate-link')
}
