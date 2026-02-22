import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PriceHistoryChart } from '../PriceHistoryChart'
import type { RelicDetail } from '@/shared/types'

// Мок хука usePriceTrends
const mockUsePriceTrends = vi.fn()
vi.mock('@/shared/hooks', () => ({
  usePriceTrends: (...args: unknown[]) => mockUsePriceTrends(...args),
}))

// Мок Recharts — jsdom не поддерживает SVG-рендеринг
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => <svg data-testid="area-chart">{children}</svg>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}))

const RELIC_STUB: RelicDetail = {
  id: '123',
  relicDefinition: {
    id: 1,
    name: 'Тестовая реликвия',
    soulLevel: 1,
    soulType: 1,
    slotType: { id: 1, name: 'Слот' },
    race: 1,
    iconUri: '',
  },
  absorbExperience: 100,
  mainAttribute: {
    attributeDefinition: { id: 1, name: 'Атака' },
    value: 50,
  },
  additionalAttributes: [],
  enhancementLevel: 0,
  price: 1000,
  priceFormatted: '1 000',
  server: { id: 1, name: 'Сервер', key: 'srv' },
  createdAt: '2026-01-01T00:00:00Z',
}

describe('PriceHistoryChart', () => {
  it('показывает спиннер при загрузке', () => {
    mockUsePriceTrends.mockReturnValue({ data: undefined, isLoading: true })
    render(<PriceHistoryChart relic={RELIC_STUB} />)
    expect(screen.getByText('История цен')).toBeInTheDocument()
  })

  it('показывает заглушку при пустых данных', () => {
    mockUsePriceTrends.mockReturnValue({ data: [], isLoading: false })
    render(<PriceHistoryChart relic={RELIC_STUB} />)
    expect(screen.getByText('Нет данных за выбранный период')).toBeInTheDocument()
  })

  it('рендерит график при наличии данных', () => {
    mockUsePriceTrends.mockReturnValue({
      data: [
        { date: '2026-01-01', averagePrice: 1000, minPrice: 800, maxPrice: 1200, volume: 5 },
        { date: '2026-01-02', averagePrice: 1100, minPrice: 900, maxPrice: 1300, volume: 3 },
      ],
      isLoading: false,
    })
    render(<PriceHistoryChart relic={RELIC_STUB} />)
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
  })

  it('переключает период', () => {
    mockUsePriceTrends.mockReturnValue({ data: [], isLoading: false })
    render(<PriceHistoryChart relic={RELIC_STUB} />)

    const btn7d = screen.getByText('7д')
    fireEvent.click(btn7d)

    // Проверяем что хук вызван с новыми параметрами (groupBy: 'day' для 7д)
    const calls = mockUsePriceTrends.mock.calls
    const lastCall = calls[calls.length - 1]!
    expect(lastCall[0].groupBy).toBe('day')
  })
})
