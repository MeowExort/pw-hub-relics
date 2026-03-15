import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnalyticsPage } from '../AnalyticsPage';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as relicsApi from '@/shared/api/relics';
import * as dictionariesApi from '@/shared/api/dictionaries';
import React from 'react';

vi.mock('@/shared/api/relics', () => ({
  getPriceTrends: vi.fn(),
}));

vi.mock('@/shared/api/dictionaries', () => ({
  getServers: vi.fn(),
  getSlotTypes: vi.fn(),
  getAttributes: vi.fn(),
}));

vi.mock('@/shared/hooks', () => ({
  useNotificationFilters: vi.fn(() => ({ filters: [], isLoading: false })),
}));

vi.mock('@/shared/api/auth', () => ({
  isAuthenticated: vi.fn(() => false),
}));

// Мок recharts — рендерим просто контейнер
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

const MOCK_TRENDS = {
  filters: {
    mainAttributes: null,
    additionalAttributes: null,
    soulLevel: null,
    soulType: null,
    slotTypeId: null,
    race: null,
    serverId: null,
  },
  period: {
    start: '2026-03-01T00:00:00',
    end: '2026-03-03T00:00:00',
  },
  dataPoints: [
    { timestamp: '2026-03-01T00:00:00', averagePrice: 5000, minPrice: 3000, maxPrice: 8000, count: 120 },
    { timestamp: '2026-03-02T00:00:00', averagePrice: 5200, minPrice: 3100, maxPrice: 8200, count: 95 },
    { timestamp: '2026-03-03T00:00:00', averagePrice: 4800, minPrice: 2900, maxPrice: 7800, count: 150 },
  ],
  statistics: {
    overallAverage: 5000,
    overallMin: 2900,
    overallMax: 8200,
    totalListings: 365,
    priceChange: -200,
    priceChangePercent: -4.0,
  },
};

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>,
  );
};

describe('AnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (dictionariesApi.getServers as any).mockResolvedValue([
      { id: 1, name: 'Сервер 1' },
      { id: 2, name: 'Сервер 2' },
    ]);
    (dictionariesApi.getSlotTypes as any).mockResolvedValue([
      { id: 1, name: 'Оружие' },
      { id: 2, name: 'Броня' },
    ]);
    (dictionariesApi.getAttributes as any).mockResolvedValue([
      { id: 1, name: 'Сила' },
      { id: 2, name: 'Ловкость' },
    ]);
    (relicsApi.getPriceTrends as any).mockResolvedValue(MOCK_TRENDS);
  });

  it('рендерит заголовок и описание', () => {
    renderWithProviders(<AnalyticsPage />);
    expect(screen.getByText('Аналитика цен')).toBeDefined();
    expect(screen.getByText(/тренды и динамика/i)).toBeDefined();
  });

  it('отображает фильтры: сервер, тип слота, период', async () => {
    renderWithProviders(<AnalyticsPage />);

    await waitFor(() => {
      expect(screen.getByText('Сервер')).toBeDefined();
    });
    expect(screen.getByText('Тип слота')).toBeDefined();
    // Кнопки периодов
    expect(screen.getByText('7д')).toBeDefined();
    expect(screen.getByText('30д')).toBeDefined();
  });

  it('загружает и отображает график после выбора сервера', async () => {
    renderWithProviders(<AnalyticsPage />);

    // Ждём загрузки серверов
    await waitFor(() => {
      expect(dictionariesApi.getServers).toHaveBeenCalled();
    });

    // Открываем dropdown и выбираем сервер
    fireEvent.click(screen.getByRole('button', { name: /Сервер/i }));
    await waitFor(() => {
      expect(screen.getByText('Сервер 1')).toBeDefined();
    });
    fireEvent.click(screen.getByText('Сервер 1'));

    await waitFor(() => {
      expect(screen.getByTestId('area-chart')).toBeDefined();
    });
  });

  it('отображает статистику рынка', async () => {
    renderWithProviders(<AnalyticsPage />);

    // Ждём загрузки серверов
    await waitFor(() => {
      expect(dictionariesApi.getServers).toHaveBeenCalled();
    });

    // Открываем dropdown и выбираем сервер
    fireEvent.click(screen.getByRole('button', { name: /Сервер/i }));
    await waitFor(() => {
      expect(screen.getAllByText('Сервер 1').length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getAllByText('Сервер 1')[0]);

    await waitFor(() => {
      expect(screen.getByText('Средняя цена')).toBeDefined();
      expect(screen.getByText('Объём торгов')).toBeDefined();
    });
  });

  it('переключает период', async () => {
    renderWithProviders(<AnalyticsPage />);

    const btn7 = screen.getByText('7д');
    fireEvent.click(btn7);

    // Кнопка 7д должна стать активной
    expect(btn7.closest('button')?.className).toContain('active');
  });
});
