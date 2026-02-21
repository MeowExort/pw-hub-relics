import { isAuthenticated } from '@/shared/api/auth'
import { SearchPage } from '@/pages/SearchPage'
import { LandingPage } from '@/pages/LandingPage'

/**
 * Главная страница приложения.
 * Если пользователь авторизован — показывает поиск реликвий.
 * Если нет — показывает лендинг с описанием функций и кнопкой «Войти».
 */
export function HomePage() {
  if (isAuthenticated()) {
    return <SearchPage />
  }

  return <LandingPage />
}
