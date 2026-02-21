import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SearchPage } from '../SearchPage'
import { AnalyticsPage } from '../AnalyticsPage'
import { GuidesPage } from '../GuidesPage'
import { NotFoundPage } from '../NotFoundPage'
import { LandingPage } from '../LandingPage'
import { HomePage } from '../HomePage'

// Мокаем модуль auth
vi.mock('@/shared/api/auth', () => ({
  isAuthenticated: vi.fn(() => false),
  startLogin: vi.fn(),
  getAccessToken: vi.fn(() => null),
  refreshAccessToken: vi.fn(),
  clearTokens: vi.fn(),
}))

import { isAuthenticated } from '@/shared/api/auth'

/** Обёртка с провайдерами для компонентов, использующих Router и React Query */
function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Страницы-заглушки', () => {
  it('SearchPage рендерит заголовок', () => {
    render(
      <Providers>
        <SearchPage />
      </Providers>,
    )
    expect(screen.getByText('Поиск реликвий')).toBeInTheDocument()
  })

  it('AnalyticsPage рендерит заголовок', () => {
    render(<AnalyticsPage />)
    expect(screen.getByText('Аналитика')).toBeInTheDocument()
  })

  it('GuidesPage рендерит заголовок', () => {
    render(<GuidesPage />)
    expect(screen.getByText('Гайды')).toBeInTheDocument()
  })

  it('NotFoundPage рендерит 404 и ссылку на главную', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Вернуться на главную')).toHaveAttribute('href', '/')
  })
})

describe('LandingPage', () => {
  it('рендерит заголовок и кнопку входа', () => {
    render(<LandingPage />)
    expect(screen.getByText('Войти')).toBeInTheDocument()
    expect(screen.getByText('Поиск реликвий')).toBeInTheDocument()
    expect(screen.getByText('Аналитика цен')).toBeInTheDocument()
    expect(screen.getByText('Уведомления')).toBeInTheDocument()
    expect(screen.getByText('Гайды')).toBeInTheDocument()
  })
})

describe('HomePage', () => {
  beforeEach(() => {
    vi.mocked(isAuthenticated).mockReset()
  })

  it('показывает LandingPage если пользователь не авторизован', () => {
    vi.mocked(isAuthenticated).mockReturnValue(false)
    render(<HomePage />)
    expect(screen.getByText('Войти')).toBeInTheDocument()
  })

  it('показывает SearchPage если пользователь авторизован', () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    render(
      <Providers>
        <HomePage />
      </Providers>,
    )
    expect(screen.getByText('Поиск реликвий')).toBeInTheDocument()
    expect(screen.queryByText('Войти')).not.toBeInTheDocument()
  })
})
