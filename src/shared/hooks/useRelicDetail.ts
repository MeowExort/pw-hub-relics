import { useQuery } from '@tanstack/react-query'
import { getRelicById } from '@/shared/api'

/** Хук для получения детальной информации о реликвии */
export function useRelicDetail(id: string | undefined) {
  return useQuery({
    queryKey: ['relics', 'detail', id],
    queryFn: ({ signal }) => getRelicById(id!, signal),
    enabled: !!id,
  })
}
