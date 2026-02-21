import { useQuery } from '@tanstack/react-query'
import { getPriceTrends } from '@/shared/api'
import type { PriceTrendsParams } from '@/shared/types'

/** Хук для получения истории цен по похожим реликвиям */
export function usePriceTrends(params: PriceTrendsParams, enabled = true) {
  return useQuery({
    queryKey: ['priceTrends', params],
    queryFn: ({ signal }) => getPriceTrends(params, signal),
    enabled,
  })
}
