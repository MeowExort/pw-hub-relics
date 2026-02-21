/**
 * Маппинг обфусцированных идентификаторов действий API.
 * Короткие хеши вместо читаемых имён эндпоинтов.
 * Значения меняются при каждом билде (через Vite define).
 */

/** Типы доступных API-действий */
export type ApiAction =
  | 'searchRelics'
  | 'getRelicById'
  | 'getServers'
  | 'getSlotTypes'
  | 'getAttributes'
  | 'getRelicDefinitions'
  | 'getEnhancementCurve'
  | 'getNotificationFilters'
  | 'createNotificationFilter'
  | 'deleteNotificationFilter'
  | 'generateTelegramLink'
  | 'getPriceTrends'

/**
 * Маппинг действий → обфусцированные идентификаторы.
 * В продакшене значения подставляются через Vite define при сборке.
 */
const ACTION_MAP: Record<ApiAction, string> = {
  searchRelics: __ACTION_SEARCH_RELICS__,
  getRelicById: __ACTION_GET_RELIC_BY_ID__,
  getServers: __ACTION_GET_SERVERS__,
  getSlotTypes: __ACTION_GET_SLOT_TYPES__,
  getAttributes: __ACTION_GET_ATTRIBUTES__,
  getRelicDefinitions: __ACTION_GET_RELIC_DEFINITIONS__,
  getEnhancementCurve: __ACTION_GET_ENHANCEMENT_CURVE__,
  getNotificationFilters: __ACTION_GET_NOTIFICATION_FILTERS__,
  createNotificationFilter: __ACTION_CREATE_NOTIFICATION_FILTER__,
  deleteNotificationFilter: __ACTION_DELETE_NOTIFICATION_FILTER__,
  generateTelegramLink: __ACTION_GENERATE_TELEGRAM_LINK__,
  getPriceTrends: __ACTION_GET_PRICE_TRENDS__,
}

/**
 * Возвращает обфусцированный идентификатор для действия API.
 * @param action — читаемое имя действия
 * @returns обфусцированный хеш-идентификатор
 */
export function getActionId(action: ApiAction): string {
  const id = ACTION_MAP[action]
  if (!id) {
    throw new Error(`Неизвестное действие API: ${action}`)
  }
  return id
}

/**
 * Маппинг действий → реальные HTTP-методы и пути (используется на стороне BFF).
 * На клиенте не используется напрямую — только для справки.
 */
export const ACTION_ROUTES: Record<ApiAction, { method: string; path: string }> = {
  searchRelics: { method: 'GET', path: '/api/relics/search' },
  getRelicById: { method: 'GET', path: '/api/relics/:id' },
  getServers: { method: 'GET', path: '/api/dictionaries/servers' },
  getSlotTypes: { method: 'GET', path: '/api/dictionaries/slot-types' },
  getAttributes: { method: 'GET', path: '/api/dictionaries/attributes' },
  getRelicDefinitions: { method: 'GET', path: '/api/dictionaries/relic-definitions' },
  getEnhancementCurve: { method: 'GET', path: '/api/dictionaries/enhancement-curve' },
  getNotificationFilters: { method: 'GET', path: '/api/notifications/filters' },
  createNotificationFilter: { method: 'POST', path: '/api/notifications/filters' },
  deleteNotificationFilter: { method: 'DELETE', path: '/api/notifications/filters/:id' },
  generateTelegramLink: { method: 'POST', path: '/api/telegram/binding/generate-link' },
  getPriceTrends: { method: 'GET', path: '/api/analytics/price-trends' },
}
