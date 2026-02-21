/**
 * API-сервис для работы с реликвиями.
 */
import { get } from './client'
import type {
  RelicListItem,
  RelicDetail,
  RelicSearchParams,
  PaginatedResponse,
} from '@/shared/types'

/** Поиск реликвий с фильтрацией и пагинацией */
export function searchRelics(
  params: RelicSearchParams,
  signal?: AbortSignal,
): Promise<PaginatedResponse<RelicListItem>> {
  return get<PaginatedResponse<RelicListItem>>('/api/relics/search', {
    params: {
      SoulType: params.soulType,
      SlotTypeId: params.slotTypeId,
      Race: params.race,
      SoulLevel: params.soulLevel,
      MainAttributeId: params.mainAttributeId,
      AdditionalAttributeIds: params.additionalAttributeIds,
      AdditionalAttributes: params.additionalAttributes,
      MinPrice: params.minPrice,
      MaxPrice: params.maxPrice,
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
    },
    signal,
  })
}

/** Получение детальной информации о реликвии */
export function getRelicById(
  id: string,
  signal?: AbortSignal,
): Promise<RelicDetail> {
  return get<RelicDetail>(`/api/relics/${id}`, { signal })
}
