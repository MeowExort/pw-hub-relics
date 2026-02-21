import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { searchRelics } from '@/shared/api'
import type { RelicSearchParams } from '@/shared/types'

/** Хук для поиска реликвий с пагинацией */
export function useRelicsSearch(params: RelicSearchParams) {
  return useQuery({
    queryKey: ['relics', 'search', params],
    queryFn: ({ signal }) => searchRelics(params, signal),
    placeholderData: keepPreviousData,
  })
}
