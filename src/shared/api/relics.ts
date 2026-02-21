/**
 * API-сервис для работы с реликвиями.
 * Все запросы проксируются через BFF.
 */
import { proxyRequest } from './proxy'
import type {
  RelicListItem,
  RelicDetail,
  RelicSearchParams,
  PaginatedResponse,
  PriceTrendsParams,
  PriceTrendPoint,
} from '@/shared/types'

/** Поиск реликвий с фильтрацией и пагинацией */
export function searchRelics(
  params: RelicSearchParams,
  signal?: AbortSignal,
): Promise<PaginatedResponse<RelicListItem>> {
  return proxyRequest<PaginatedResponse<RelicListItem>>('searchRelics', {
    SoulType: params.soulType,
    SlotTypeId: params.slotTypeId,
    Race: params.race,
    SoulLevel: params.soulLevel,
    MainAttributeId: params.mainAttributeId,
    AdditionalAttributeIds: params.additionalAttributeIds,
    AdditionalAttributes: params.additionalAttributes,
    MinPrice: params.minPrice != null ? params.minPrice * 100 : undefined,
    MaxPrice: params.maxPrice != null ? params.maxPrice * 100 : undefined,
    ServerId: params.serverId,
    MinEnhancementLevel: params.minEnhancementLevel,
    MaxEnhancementLevel: params.maxEnhancementLevel,
    MinAbsorbExperience: params.minAbsorbExperience,
    MaxAbsorbExperience: params.maxAbsorbExperience,
    SortBy: params.sortBy,
    SortDirection: params.sortDirection,
    SortAttributeId: params.sortAttributeId,
    PageNumber: params.pageNumber,
    PageSize: params.pageSize,
  }, signal)
}

/** Получение детальной информации о реликвии */
export function getRelicById(
  id: string,
  signal?: AbortSignal,
): Promise<RelicDetail> {
  return proxyRequest<RelicDetail>('getRelicById', { id }, signal)
}

/** Получение истории цен по похожим реликвиям */
export function getPriceTrends(
  params: PriceTrendsParams,
  signal?: AbortSignal,
): Promise<PriceTrendPoint[]> {
  return proxyRequest<PriceTrendPoint[]>('getPriceTrends', {
    'MainAttribute.Id': params.mainAttribute?.id,
    'MainAttribute.MinValue': params.mainAttribute?.minValue,
    'MainAttribute.MaxValue': params.mainAttribute?.maxValue,
    AdditionalAttributes: params.additionalAttributes,
    RelicDefinitionId: params.relicDefinitionId,
    SoulLevel: params.soulLevel,
    SoulType: params.soulType,
    StartDate: params.startDate,
    EndDate: params.endDate,
    ServerId: params.serverId,
    GroupBy: params.groupBy,
  }, signal)
}
