import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/shared/theme'
import { router } from './router'

/** Клиент React Query с настройками по умолчанию */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (failureCount, error) => {
        // Не ретраить при отмене запроса (AbortError от StrictMode/unmount)
        if (error instanceof DOMException && error.name === 'AbortError') return false
        return failureCount < 1
      },
      refetchOnWindowFocus: false,
    },
  },
})

/** Корневой компонент приложения */
export function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
