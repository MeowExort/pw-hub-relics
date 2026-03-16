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
  mainAttributeIds?: number[]
  additionalAttributes?: AttributeFilterDto[]
  minPrice?: number
  maxPrice?: number
  serverId?: number
  minEnhancementLevel?: number
  maxEnhancementLevel?: number
  minAbsorbExperience?: number
  maxAbsorbExperience?: number
  minAdditionalAttributeCount?: number
  maxAdditionalAttributeCount?: number
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
  mainAttributeIds?: number[] | null
  additionalAttributes?: AttributeFilterDto[] | null
  minPrice?: number | null
  maxPrice?: number | null
  serverId?: number | null
  minEnhancementLevel?: number | null
  maxEnhancementLevel?: number | null
  minAbsorbExperience?: number | null
  maxAbsorbExperience?: number | null
  minAdditionalAttributeCount?: number | null
  maxAdditionalAttributeCount?: number | null
}

/** Запрос на создание фильтра уведомлений */
export interface CreateFilterRequest {
  name: string
  criteria: FilterCriteriaDto
}

/** Запрос на обновление фильтра уведомлений */
export interface UpdateFilterRequest {
  name: string
  criteria: FilterCriteriaDto
}

/** Запрос на переключение активности фильтра */
export interface ToggleFilterRequest {
  isEnabled: boolean
}

/** Фильтр уведомлений */
export interface NotificationFilter {
  id: string
  name: string
  criteria: FilterCriteriaDto
  isEnabled: boolean
  createdAt: string
  updatedAt: string
}

/** Частота уведомлений: 0 — мгновенно, 1 — раз в час, 2 — раз в день */
export enum NotificationFrequency {
  Instant = 0,
  Hourly = 1,
  Daily = 2,
}

/** Настройки уведомлений */
export interface NotificationSettings {
  frequency: NotificationFrequency
  quietHoursEnabled: boolean
  quietHoursStart: string | null
  quietHoursEnd: string | null
}

/** Запрос на обновление настроек уведомлений */
export interface UpdateNotificationSettingsRequest {
  frequency?: NotificationFrequency
  quietHoursEnabled?: boolean | null
  quietHoursStart?: string | null
  quietHoursEnd?: string | null
}

/** Статус привязки Telegram */
export interface TelegramBindingStatus {
  isLinked: boolean
  telegramUsername?: string | null
  linkedAt?: string | null
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
  startDate: string
  endDate: string
  soulType?: number
  slotTypeId?: number
  race?: number
  soulLevel?: number
  mainAttributeIds?: number[]
  additionalAttributes?: AttributeFilterDto[]
  minPrice?: number
  maxPrice?: number
  serverId?: number
  minEnhancementLevel?: number
  maxEnhancementLevel?: number
  minAbsorbExperience?: number
  maxAbsorbExperience?: number
  minAdditionalAttributeCount?: number
  maxAdditionalAttributeCount?: number
  groupBy?: 'hour' | 'day' | 'week'
}

/** Точка данных ценового тренда */
export interface PriceTrendPoint {
  timestamp: string
  averagePrice: number
  minPrice: number
  maxPrice: number
  count: number
}

/** Расшифровка фильтра в ответе */
export interface PriceTrendFilterRef {
  id: number
  name: string
}

/** Блок применённых фильтров в ответе ценовых трендов */
export interface PriceTrendsFilters {
  mainAttributes: PriceTrendFilterRef[] | null
  additionalAttributes: PriceTrendFilterRef[] | null
  soulLevel: number | null
  soulType: number | null
  slotTypeId: number | null
  race: number | null
  serverId: number | null
}

/** Период анализа */
export interface PriceTrendsPeriod {
  start: string
  end: string
}

/** Агрегированная статистика за весь период */
export interface PriceTrendsStatistics {
  overallAverage: number
  overallMin: number
  overallMax: number
  totalListings: number
  priceChange: number
  priceChangePercent: number
}

/** Ответ эндпоинта GET /api/analytics/price-trends */
export interface GetPriceTrendsResponse {
  filters: PriceTrendsFilters
  period: PriceTrendsPeriod
  dataPoints: PriceTrendPoint[]
  statistics: PriceTrendsStatistics
}

/** Команда для расчета оптимальной заточки */
export interface CalculateCheapestEnhancementCommand {
  targetEnhancementLevel: number
  currentEnhancementLevel: number
  serverId?: number
  soulType: number
}

/** Результат расчета оптимальной заточки */
export interface CheapestEnhancementResult {
  targetLevel: number
  requiredExperience: number
  currentExperience: number
  missingExperience: number
  recommendations?: Recommendation[]
  totalRelicsNeeded: number
  totalCost: number
  totalCostFormatted: string
  averagePricePerExperience: number
  steps?: string[]
}

/** Рекомендация по реликвии для заточки */
export interface Recommendation {
  relicListingId: string
  relicName: string
  absorbExperience: number
  price: number
  pricePerExperience: number
  cumulativeExperience: number
  cumulativeCost: number
}

/** Результат запроса самого профитного квеста */
export interface MostProfitableQuestResult {
  serverId: number
  serverName: string
  calculatedAt: string
  recommendations: QuestRecommendation[]
  levelOneRecommendations: LevelOneRecommendation[]
}

/** Рекомендация по квесту */
export interface QuestRecommendation {
  rank: number
  soulType: number
  soulTypeName: string
  targetSoulLevel: number
  questCost: number
  questCostFormatted: string
  expectedReward: number
  expectedRewardFormatted: string
  expectedProfit: number
  expectedProfitFormatted: string
  profitPercent: number
  listingsCountByQuestCost?: number
  listingsCountByExpectedReward?: number
  priceBreakdown: Record<string, PriceBreakdownEntry>
}

/** Рекомендация для 1 уровня души */
export interface LevelOneRecommendation {
  rank: number
  soulType: number
  soulTypeName: string
  expectedReward: number
  expectedRewardFormatted: string
  listingsCountByExpectedReward?: number
  avgMinPriceByRace: Record<string, number>
  listingsCount: number
}

/** Запись разбивки цен по уровню */
export interface PriceBreakdownEntry {
  avgMinPrice: number
  minPriceByRace: Record<string, number>
  listingsCount: number
}
