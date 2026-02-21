/// <reference types="vite/client" />

/**
 * Глобальные константы, подставляемые Vite define при сборке.
 * Обфусцированные идентификаторы действий API — меняются при каждом билде.
 */
declare const __ACTION_SEARCH_RELICS__: string
declare const __ACTION_GET_RELIC_BY_ID__: string
declare const __ACTION_GET_SERVERS__: string
declare const __ACTION_GET_SLOT_TYPES__: string
declare const __ACTION_GET_ATTRIBUTES__: string
declare const __ACTION_GET_RELIC_DEFINITIONS__: string
declare const __ACTION_GET_ENHANCEMENT_CURVE__: string
declare const __ACTION_GET_NOTIFICATION_FILTERS__: string
declare const __ACTION_CREATE_NOTIFICATION_FILTER__: string
declare const __ACTION_DELETE_NOTIFICATION_FILTER__: string
declare const __ACTION_GENERATE_TELEGRAM_LINK__: string
declare const __ACTION_GET_PRICE_TRENDS__: string

/** Секрет для HMAC-подписи запросов */
declare const __SIGNING_SECRET__: string
