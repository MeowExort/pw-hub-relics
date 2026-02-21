import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '@/shared/api/auth'

/**
 * Обёртка для защищённых маршрутов.
 * Перенаправляет на главную страницу, если пользователь не авторизован.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
