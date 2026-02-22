import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTelegramBindingStatus,
  generateTelegramLink,
  deleteTelegramBinding,
  sendTestNotification,
} from '@/shared/api'

const QUERY_KEY = ['telegram', 'binding']

/** Хук для управления привязкой Telegram */
export function useTelegramBinding() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: ({ signal }) => getTelegramBindingStatus(signal),
  })

  const generateLinkMutation = useMutation({
    mutationFn: generateTelegramLink,
    onSuccess: (data) => {
      window.open(data.deepLink, 'telegram_binding', 'width=550,height=600,scrollbars=yes')
    },
  })

  const unbindMutation = useMutation({
    mutationFn: deleteTelegramBinding,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  })

  const testMutation = useMutation({
    mutationFn: sendTestNotification,
  })

  return {
    status: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    generateLink: generateLinkMutation.mutateAsync,
    generatedLink: generateLinkMutation.data?.deepLink ?? null,
    isGenerating: generateLinkMutation.isPending,
    unbind: unbindMutation.mutateAsync,
    isUnbinding: unbindMutation.isPending,
    sendTest: testMutation.mutateAsync,
    isSendingTest: testMutation.isPending,
    testSuccess: testMutation.isSuccess,
  }
}
