/**
 * Типы данных API для PW Hub Relics.
 * Основаны на swagger.json спецификации.
 */

/** Фильтр по атрибуту */
export interface AttributeFilterDto {
  id: number
  minValue?: number | null
  maxValue?: number | null
}

/** Атрибут реликвии (ввод) */
export interface RelicAttributeInput {
  attributeDefinitionId: number
  value: number
}

/** Определение атрибута (вложенное в ответ API) */
export interface AttributeDefinitionRef {
  id: number
  name: string
}

/** Атрибут реликвии (отображение) */
export interface RelicAttribute {
  attributeDefinition: AttributeDefinitionRef
  value: number
}

/** Определение слота (вложенное в ответ API) */
export interface SlotTypeRef {
  id: number
  name: string
}

/** Определение реликвии (вложенное в ответ API) */
export interface RelicDefinitionRef {
  id: number
  name: string
  soulLevel: number
  soulType: number
  slotType: SlotTypeRef
  race: number
  iconUri: string
}

/** Сервер (вложенный в ответ API) */
export interface ServerRef {
  id: number
  name: string
  key: string
}

/** Реликвия (краткая карточка для списка) */
export interface RelicListItem {
  id: string
  relicDefinition: RelicDefinitionRef
  absorbExperience: number
  mainAttribute: RelicAttribute
  additionalAttributes: RelicAttribute[]
  enhancementLevel: number
  price: number
  priceFormatted: string
  server: ServerRef
  createdAt: string
}

/** Реликвия (детальная информация) */
export interface RelicDetail extends RelicListItem {
  sellerCharacterId?: number
  shopPosition?: number
}

/** Параметры поиска реликвий */
export interface RelicSearchParams {
  soulType?: number
  slotTypeId?: number
  race?: number
  soulLevel?: number
  mainAttributeId?: number
  additionalAttributeIds?: number[]
  additionalAttributes?: AttributeFilterDto[]
  minPrice?: number
  maxPrice?: number
  serverId?: number
  minEnhancementLevel?: number
  maxEnhancementLevel?: number
  minAbsorbExperience?: number
  maxAbsorbExperience?: number
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  sortAttributeId?: number
  pageNumber?: number
  pageSize?: number
}

/** Пагинированный ответ */
export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

/** Критерии фильтра уведомлений */
export interface FilterCriteriaDto {
  soulType?: number | null
  slotTypeId?: number | null
  race?: number | null
  soulLevel?: number | null
  mainAttributeId?: number | null
  requiredAdditionalAttributeIds?: number[] | null
  minPrice?: number | null
  maxPrice?: number | null
  serverId?: number | null
}

/** Запрос на создание фильтра уведомлений */
export interface CreateFilterRequest {
  name: string
  criteria: FilterCriteriaDto
}

/** Фильтр уведомлений */
export interface NotificationFilter {
  id: string
  name: string
  criteria: FilterCriteriaDto
  isActive: boolean
  createdAt: string
}

/** Сервер */
export interface Server {
  id: number
  name: string
}

/** Тип слота */
export interface SlotType {
  id: number
  name: string
}

/** Определение атрибута */
export interface AttributeDefinition {
  id: number
  name: string
}

/** Определение реликвии */
export interface RelicDefinition {
  id: number
  name: string
  soulType: number
  slotTypeId: number
}

/** Кривая заточки */
export interface EnhancementCurvePoint {
  level: number
  cost: number
  successRate: number
}

/** Параметры запроса ценовых трендов */
export interface PriceTrendsParams {
  mainAttribute?: AttributeFilterDto
  additionalAttributes?: AttributeFilterDto[]
  relicDefinitionId?: number
  soulLevel?: number
  soulType?: number
  startDate?: string
  endDate?: string
  serverId?: number
  groupBy?: string
}

/** Точка данных ценового тренда */
export interface PriceTrendPoint {
  date: string
  averagePrice: number
  minPrice: number
  maxPrice: number
  volume: number
}
