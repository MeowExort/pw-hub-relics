import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnalyticsFilters } from '../AnalyticsFilters';
import * as dictionariesApi from '@/shared/api/dictionaries';
import React from 'react';

vi.mock('@/shared/api/dictionaries', () => ({
  getServers: vi.fn(),
  getSlotTypes: vi.fn(),
  getAttributes: vi.fn(),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

const defaultProps = {
  serverId: undefined as number | undefined,
  onServerChange: vi.fn(),
  period: '30d' as const,
  onPeriodChange: vi.fn(),
  soulLevel: undefined as number | undefined,
  onSoulLevelChange: vi.fn(),
  soulType: undefined as number | undefined,
  onSoulTypeChange: vi.fn(),
  slotTypeId: undefined as number | undefined,
  onSlotTypeIdChange: vi.fn(),
  race: undefined as number | undefined,
  onRaceChange: vi.fn(),
  groupBy: undefined as 'hour' | 'day' | 'week' | undefined,
  onGroupByChange: vi.fn(),
  mainAttributeIds: undefined as number[] | undefined,
  onMainAttributeIdsChange: vi.fn(),
  additionalAttributes: [] as { id: number; minValue?: number | null; maxValue?: number | null }[],
  onAdditionalAttributesChange: vi.fn(),
  minPrice: undefined as number | undefined,
  maxPrice: undefined as number | undefined,
  onMinPriceChange: vi.fn(),
  onMaxPriceChange: vi.fn(),
  minEnhancementLevel: undefined as number | undefined,
  maxEnhancementLevel: undefined as number | undefined,
  onMinEnhancementLevelChange: vi.fn(),
  onMaxEnhancementLevelChange: vi.fn(),
  minAbsorbExperience: undefined as number | undefined,
  maxAbsorbExperience: undefined as number | undefined,
  onMinAbsorbExperienceChange: vi.fn(),
  onMaxAbsorbExperienceChange: vi.fn(),
  minAdditionalAttributeCount: undefined,
  maxAdditionalAttributeCount: undefined,
  onMinAdditionalAttributeCountChange: vi.fn(),
  onMaxAdditionalAttributeCountChange: vi.fn(),
};

describe('AnalyticsFilters', () => {
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
  });

  it('рендерит фильтр сервера', async () => {
    renderWithProviders(<AnalyticsFilters {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('Сервер')).toBeDefined();
    });
  });

  it('рендерит фильтр уровня души', async () => {
    renderWithProviders(<AnalyticsFilters {...defaultProps} />);
    expect(screen.getByText('Уровень души')).toBeDefined();
  });

  it('рендерит фильтр типа души', async () => {
    renderWithProviders(<AnalyticsFilters {...defaultProps} />);
    expect(screen.getByText('Тип души')).toBeDefined();
  });

  it('рендерит фильтр типа слота', async () => {
    renderWithProviders(<AnalyticsFilters {...defaultProps} />);
    expect(screen.getByText('Тип слота')).toBeDefined();
  });

  it('рендерит фильтр расы', async () => {
    renderWithProviders(<AnalyticsFilters {...defaultProps} />);
    expect(screen.getByText('Раса')).toBeDefined();
  });

  it('рендерит фильтр группировки', async () => {
    renderWithProviders(<AnalyticsFilters {...defaultProps} />);
    expect(screen.getByText('Группировка')).toBeDefined();
  });

  it('рендерит фильтр основного атрибута', async () => {
    renderWithProviders(<AnalyticsFilters {...defaultProps} />);
    expect(screen.getByText('Основной атрибут')).toBeDefined();
  });

  it('рендерит фильтр дополнительных атрибутов', async () => {
    renderWithProviders(<AnalyticsFilters {...defaultProps} />);
    expect(screen.getByText('Доп. атрибуты')).toBeDefined();
  });

  it('рендерит кнопки периодов', () => {
    renderWithProviders(<AnalyticsFilters {...defaultProps} />);
    expect(screen.getByText('7д')).toBeDefined();
    expect(screen.getByText('30д')).toBeDefined();
  });

  it('вызывает onSoulLevelChange при выборе уровня души', async () => {
    renderWithProviders(<AnalyticsFilters {...defaultProps} />);

    const soulLevelBtn = screen.getByRole('button', { name: /Уровень души/i });
    fireEvent.click(soulLevelBtn);

    await waitFor(() => {
      expect(screen.getByText('3 уровень')).toBeDefined();
    });
    fireEvent.click(screen.getByText('3 уровень'));

    expect(defaultProps.onSoulLevelChange).toHaveBeenCalledWith(3);
  });

  it('вызывает onSoulTypeChange при выборе типа души', async () => {
    renderWithProviders(<AnalyticsFilters {...defaultProps} />);

    const soulTypeBtn = screen.getByRole('button', { name: /Тип души/i });
    fireEvent.click(soulTypeBtn);

    await waitFor(() => {
      expect(screen.getByText('Душа Покоя')).toBeDefined();
    });
    fireEvent.click(screen.getByText('Душа Покоя'));

    expect(defaultProps.onSoulTypeChange).toHaveBeenCalledWith(1);
  });

  it('вызывает onGroupByChange при выборе группировки', async () => {
    renderWithProviders(<AnalyticsFilters {...defaultProps} />);

    const groupByBtn = screen.getByRole('button', { name: /Группировка/i });
    fireEvent.click(groupByBtn);

    await waitFor(() => {
      expect(screen.getByText('По дням')).toBeDefined();
    });
    fireEvent.click(screen.getByText('По дням'));

    expect(defaultProps.onGroupByChange).toHaveBeenCalledWith('day');
  });

  it('вызывает onMainAttributeIdsChange при выборе основного атрибута', async () => {
    renderWithProviders(<AnalyticsFilters {...defaultProps} />);

    // Ждём загрузки атрибутов и открываем MultiSelect
    await waitFor(() => {
      expect(screen.getByText('Основной атрибут')).toBeDefined();
    });
    const mainAttrBtn = screen.getByText('Основной атрибут').closest('div')!.querySelector('button')!;
    fireEvent.click(mainAttrBtn);

    await waitFor(() => {
      expect(screen.getByText('Сила')).toBeDefined();
    });

    // MultiSelect использует чекбоксы
    const checkbox = screen.getByText('Сила').closest('label')!.querySelector('input[type="checkbox"]')!;
    fireEvent.click(checkbox);

    expect(defaultProps.onMainAttributeIdsChange).toHaveBeenCalledWith([1]);
  });

  it('вызывает onPeriodChange при клике на кнопку периода', () => {
    renderWithProviders(<AnalyticsFilters {...defaultProps} />);

    fireEvent.click(screen.getByText('7д'));
    expect(defaultProps.onPeriodChange).toHaveBeenCalledWith('7d');
  });
});
