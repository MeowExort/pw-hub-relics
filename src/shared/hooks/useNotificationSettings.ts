import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotificationSettings, updateNotificationSettings } from '@/shared/api'
import type { UpdateNotificationSettingsRequest } from '@/shared/types'

const QUERY_KEY = ['telegram', 'notification-settings']

/** Хук для управления настройками уведомлений */
export function useNotificationSettings() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: ({ signal }) => getNotificationSettings(signal),
  })

  const updateMutation = useMutation({
    mutationFn: (data: UpdateNotificationSettingsRequest) => updateNotificationSettings(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  return {
    settings: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  }
}
