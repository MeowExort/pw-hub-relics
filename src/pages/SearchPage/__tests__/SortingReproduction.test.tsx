import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SearchPage } from '../SearchPage'
import { useRelicsSearch, useDictionaries } from '@/shared/hooks'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

vi.mock('@/shared/hooks', () => ({
  useRelicsSearch: vi.fn(),
  useDictionaries: vi.fn(),
}))

const mockAttributes = [
  { id: 1, name: 'Сила' },
  { id: 2, name: 'Ловкость' },
]

describe('SearchPage Sorting Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useDictionaries as any).mockReturnValue({
      servers: [],
      slotTypes: [],
      attributes: mockAttributes,
      isLoading: false,
      isError: false,
    })
    ;(useRelicsSearch as any).mockReturnValue({
      data: { items: [{ id: '1', relicDefinition: { name: 'Test' }, mainAttribute: { value: 10, attributeDefinition: { name: 'Сила' } }, additionalAttributes: [], price: 100, server: { name: 'Server' } }], totalCount: 1, pageNumber: 1, totalPages: 1 },
      isLoading: false,
      isError: false,
    })
  })

  it('updates sorting and triggers new search', async () => {
    render(
      <MemoryRouter initialEntries={['/search']}>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </MemoryRouter>
    )

    // Находим кнопку кастомного Select по aria-label
    const sortButton = screen.getByRole('button', { name: 'Сортировка по' })
    expect(sortButton).toBeInTheDocument()

    // Открываем выпадающий список
    fireEvent.click(sortButton)

    // Выбираем опцию «Цена»
    fireEvent.click(screen.getByRole('option', { name: 'Цена' }))

    // Проверяем, что useRelicsSearch вызван с новыми параметрами
    await waitFor(() => {
      expect(useRelicsSearch).toHaveBeenCalledWith(expect.objectContaining({
        sortBy: 'Price',
        pageNumber: 1
      }))
    })
  })
})
