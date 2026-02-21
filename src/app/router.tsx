import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { HomePage } from '@/pages/HomePage'
import { SearchPage } from '@/pages/SearchPage'
import { RelicDetailPage } from '@/pages/RelicDetailPage'
import { SubscriptionsPage } from '@/pages/SubscriptionsPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { GuidesPage } from '@/pages/GuidesPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { CallbackPage } from '@/pages/CallbackPage'
import { ProtectedRoute } from './ProtectedRoute'

/** Конфигурация маршрутов приложения */
export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/callback', element: <CallbackPage /> },
      { path: '/search', element: <SearchPage /> },
      { path: '/relics/:id', element: <RelicDetailPage /> },
      {
        path: '/subscriptions',
        element: (
          <ProtectedRoute>
            <SubscriptionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/analytics',
        element: (
          <ProtectedRoute>
            <AnalyticsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/guides',
        element: (
          <ProtectedRoute>
            <GuidesPage />
          </ProtectedRoute>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
