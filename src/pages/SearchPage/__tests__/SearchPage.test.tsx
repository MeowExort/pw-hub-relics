import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { SearchPage } from '../SearchPage'
import { useRelicsSearch, useDictionaries } from '@/shared/hooks'
import { useRelicSearchParams } from '../useSearchParams'
import { BrowserRouter } from 'react-router-dom'
import { isAuthenticated } from '@/shared/api/auth'

vi.mock('@/shared/hooks', () => ({
  useRelicsSearch: vi.fn(),
  useDictionaries: vi.fn(),
  useNotificationFilters: vi.fn(() => ({ filters: [], isLoading: false })),
  useAttributeStyles: vi.fn(() => ({
    settings: { attributes: {} },
    updateSettings: vi.fn(),
    getAttributeColor: vi.fn(() => null),
  })),
}))

vi.mock('../useSearchParams', () => ({
  useRelicSearchParams: vi.fn(),
}))

vi.mock('@/shared/api/auth', () => ({
  isAuthenticated: vi.fn(),
}))

const mockAttributes = [
  { id: 1, name: 'Сила' },
  { id: 2, name: 'Ловкость' },
]

describe('SearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useDictionaries as any).mockReturnValue({
      servers: [],
      slotTypes: [],
      attributes: mockAttributes,
      isLoading: false,
      isError: false,
    })
    ;(useRelicSearchParams as any).mockReturnValue({
      params: {},
      setParams: vi.fn(),
      resetParams: vi.fn(),
    })
    ;(useRelicsSearch as any).mockReturnValue({
      data: { items: [], totalCount: 0, pageNumber: 1, totalPages: 1 },
      isLoading: false,
      isError: false,
    })
    ;(isAuthenticated as any).mockReturnValue(false)
  })

  it('рендерит элементы сортировки при наличии данных', () => {
    ;(useRelicsSearch as any).mockReturnValue({
      data: { items: [{ id: '1', relicDefinition: { name: 'Test' }, mainAttribute: { value: 10, attributeDefinition: { name: 'Сила' } }, additionalAttributes: [], price: 100, server: { name: 'Server' } }], totalCount: 1, pageNumber: 1, totalPages: 1 },
      isLoading: false,
      isError: false,
    })

    render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    )

    expect(screen.getByLabelText('Сортировка по')).toBeInTheDocument()
    expect(screen.getByLabelText('Направление сортировки')).toBeInTheDocument()
  })

  it('показывает выбор атрибута если выбрана сортировка по атрибуту', () => {
    ;(useRelicSearchParams as any).mockReturnValue({
      params: { sortBy: 'Attribute' },
      setParams: vi.fn(),
      resetParams: vi.fn(),
    })
    ;(useRelicsSearch as any).mockReturnValue({
      data: { items: [], totalCount: 0, pageNumber: 1, totalPages: 1 },
      isLoading: false,
      isError: false,
    })

    render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    )

    expect(screen.getByLabelText('Выберите атрибут')).toBeInTheDocument()
  })

  it('показывает кнопку подписки в фильтрах для авторизованного пользователя', () => {
    ;(isAuthenticated as any).mockReturnValue(true)
    ;(useRelicSearchParams as any).mockReturnValue({
      params: {},
      setParams: vi.fn(),
      resetParams: vi.fn(),
    })

    render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    )

    // Сначала открываем фильтры, так как по умолчанию они могут быть закрыты (в SearchPage filtersOpen=false)
    const filterToggle = screen.getByRole('button', { name: /Фильтры/i })
    act(() => {
      filterToggle.click()
    })

    expect(screen.getByRole('button', { name: /Подписаться на фильтр/i })).toBeInTheDocument()
  })

  it('не показывает кнопку подписки для неавторизованного пользователя', () => {
    ;(isAuthenticated as any).mockReturnValue(false)
    
    render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    )

    const filterToggle = screen.getByRole('button', { name: /Фильтры/i })
    act(() => {
      filterToggle.click()
    })

    expect(screen.queryByRole('button', { name: /Подписаться на фильтр/i })).not.toBeInTheDocument()
  })
})
