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
  GetPriceTrendsResponse,
  MostProfitableQuestResult,
  CalculateCheapestEnhancementCommand,
  CheapestEnhancementResult,
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
    MainAttributeIds: params.mainAttributeIds,
    AdditionalAttributes: params.additionalAttributes,
    MinPrice: params.minPrice != null ? params.minPrice * 100 : undefined,
    MaxPrice: params.maxPrice != null ? params.maxPrice * 100 : undefined,
    ServerId: params.serverId,
    MinEnhancementLevel: params.minEnhancementLevel,
    MaxEnhancementLevel: params.maxEnhancementLevel,
    MinAbsorbExperience: params.minAbsorbExperience,
    MaxAbsorbExperience: params.maxAbsorbExperience,
    MinAdditionalAttributeCount: params.minAdditionalAttributeCount,
    MaxAdditionalAttributeCount: params.maxAdditionalAttributeCount,
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

/** Получение тенденций цен на реликвии */
export function getPriceTrends(
  params: PriceTrendsParams,
  signal?: AbortSignal,
): Promise<GetPriceTrendsResponse> {
  return proxyRequest<GetPriceTrendsResponse>('getPriceTrends', {
    startDate: params.startDate,
    endDate: params.endDate,
    soulType: params.soulType,
    slotTypeId: params.slotTypeId,
    race: params.race,
    soulLevel: params.soulLevel,
    mainAttributeIds: params.mainAttributeIds,
    additionalAttributes: params.additionalAttributes,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    serverId: params.serverId,
    minEnhancementLevel: params.minEnhancementLevel,
    maxEnhancementLevel: params.maxEnhancementLevel,
    minAbsorbExperience: params.minAbsorbExperience,
    maxAbsorbExperience: params.maxAbsorbExperience,
    minAdditionalAttributeCount: params.minAdditionalAttributeCount,
    maxAdditionalAttributeCount: params.maxAdditionalAttributeCount,
    groupBy: params.groupBy,
  }, signal)
}

/** Расчет самого дешевого способа заточки */
export function calculateCheapestEnhancement(
  command: CalculateCheapestEnhancementCommand,
  signal?: AbortSignal,
): Promise<CheapestEnhancementResult> {
  return proxyRequest<CheapestEnhancementResult>('calculateCheapestEnhancement', command as unknown as Record<string, unknown>, signal)
}

/** Получение самого профитного квеста */
export function getMostProfitableQuest(
  serverId?: number,
  signal?: AbortSignal,
): Promise<MostProfitableQuestResult> {
  return proxyRequest<MostProfitableQuestResult>('getMostProfitableQuest', { serverId }, signal)
}
