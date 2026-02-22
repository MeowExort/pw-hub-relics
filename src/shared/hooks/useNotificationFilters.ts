import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getNotificationFilters,
  createNotificationFilter,
  updateNotificationFilter,
  toggleNotificationFilter,
  deleteNotificationFilter,
} from '@/shared/api'
import type { CreateFilterRequest, UpdateFilterRequest } from '@/shared/types'

const QUERY_KEY = ['notifications', 'filters']

/** Хук для работы с фильтрами уведомлений (CRUD + toggle) */
export function useNotificationFilters() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: ({ signal }) => getNotificationFilters(signal),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateFilterRequest) => createNotificationFilter(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFilterRequest }) =>
      updateNotificationFilter(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      toggleNotificationFilter(id, { isEnabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteNotificationFilter(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  return {
    filters: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    create: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    toggle: toggleMutation.mutateAsync,
    isToggling: toggleMutation.isPending,
    remove: deleteMutation.mutateAsync,
    isRemoving: deleteMutation.isPending,
  }
}
