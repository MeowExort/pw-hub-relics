import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GuidesPage } from '../GuidesPage';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as relicsApi from '@/shared/api/relics';
import * as dictionariesApi from '@/shared/api/dictionaries';
import React from 'react';

// Мокаем API
vi.mock('@/shared/api/relics', () => ({
  getMostProfitableQuest: vi.fn(),
  calculateCheapestEnhancement: vi.fn(),
}));

vi.mock('@/shared/api/dictionaries', () => ({
  getServers: vi.fn(),
}));

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const mockQuestResult = {
  serverId: 1,
  serverName: 'Сервер 1',
  calculatedAt: '2026-03-15T12:00:00Z',
  recommendations: [
    {
      rank: 1,
      soulType: 2,
      soulTypeName: 'Тяньюя',
      targetSoulLevel: 4,
      questCost: 858,
      questCostFormatted: '8 зол. 58 сер.',
      expectedReward: 1472,
      expectedRewardFormatted: '14 зол. 72 сер.',
      expectedProfit: 614,
      expectedProfitFormatted: '6 зол. 14 сер.',
      profitPercent: 71.6,
      priceBreakdown: {},
    },
    {
      rank: 2,
      soulType: 1,
      soulTypeName: 'Покоя',
      targetSoulLevel: 4,
      questCost: 640,
      questCostFormatted: '6 зол. 40 сер.',
      expectedReward: 1088,
      expectedRewardFormatted: '10 зол. 88 сер.',
      expectedProfit: 448,
      expectedProfitFormatted: '4 зол. 48 сер.',
      profitPercent: 70,
      priceBreakdown: {},
    },
  ],
  levelOneRecommendations: [
    {
      rank: 1,
      soulType: 2,
      soulTypeName: 'Тяньюя',
      expectedReward: 119,
      expectedRewardFormatted: '1 зол. 19 сер.',
      avgMinPriceByRace: {},
      listingsCount: 1059,
    },
  ],
};

describe('GuidesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    (dictionariesApi.getServers as any).mockResolvedValue([
      { id: 1, name: 'Сервер 1' },
      { id: 2, name: 'Сервер 2' },
    ]);
    (relicsApi.getMostProfitableQuest as any).mockResolvedValue(mockQuestResult);
    (relicsApi.calculateCheapestEnhancement as any).mockResolvedValue({
      targetLevel: 5,
      requiredExperience: 50000,
      currentExperience: 0,
      missingExperience: 50000,
      totalRelicsNeeded: 2,
      totalCost: 1000000,
      totalCostFormatted: '100 зол. 00 сер.',
      averagePricePerExperience: 0.02,
      steps: ['Шаг 1', 'Шаг 2'],
      recommendations: [
        {
          relicListingId: 'rec-1',
          relicName: 'Рекомендация 1',
          absorbExperience: 25000,
          price: 500000,
          pricePerExperience: 0.02,
          cumulativeExperience: 25000,
          cumulativeCost: 500000,
        }
      ]
    });
  });

  it('рендерит заголовок и табы', async () => {
    renderWithProviders(<GuidesPage />);
    expect(screen.getByText('Заточка реликвий')).toBeDefined();
    expect(screen.getByText('Квесты и награды')).toBeDefined();
  });

  it('переключает табы', async () => {
    renderWithProviders(<GuidesPage />);
    
    // По умолчанию открыта заточка
    expect(screen.getByText('Калькулятор стоимости заточки')).toBeDefined();
    
    // Переключаем на квесты
    fireEvent.click(screen.getAllByText('Квесты и награды')[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Выберите сервер для отображения рекомендаций')).toBeDefined();
    });
    
    expect(screen.queryByText('Калькулятор стоимости заточки')).toBeNull();
  });

  it('калькулятор заточки отображает данные из API после выбора сервера', async () => {
    renderWithProviders(<GuidesPage />);
    
    // Сначала видим подсказку о выборе сервера
    expect(screen.getByText('Выберите сервер и желаемый уровень для расчета.')).toBeDefined();

    // Выбираем сервер
    const serverSelect = screen.getByRole('button', { name: /Сервер/i });
    fireEvent.click(serverSelect);
    
    // Ждем появления опций
    await waitFor(() => {
      expect(screen.getByText('Сервер 1')).toBeDefined();
    });

    const serverOption = screen.getByText('Сервер 1');
    fireEvent.click(serverOption);

    // Ждем загрузки данных из мока
    await waitFor(() => {
      expect(screen.getByText('100 зол. 00 сер.')).toBeDefined();
    });
    
    expect(screen.getByText('Шаг 1')).toBeDefined();
    expect(screen.getByText('Рекомендация 1')).toBeDefined();
    expect(screen.getByText('Требуется опыта:')).toBeDefined();
    // 50 000 встречается дважды (required и missing в моке)
    expect(screen.getAllByText('50 000')).toHaveLength(2);
  });

  it('отображает рекомендации по квестам после выбора сервера', async () => {
    renderWithProviders(<GuidesPage />);
    
    fireEvent.click(screen.getAllByText('Квесты и награды')[0]);
    
    // Сначала видим плейсхолдер
    await waitFor(() => {
      expect(screen.getByText('Выберите сервер для отображения рекомендаций')).toBeDefined();
    });

    // Выбираем сервер
    const serverSelect = screen.getByRole('button', { name: /Сервер/i });
    fireEvent.click(serverSelect);
    
    await waitFor(() => {
      expect(screen.getByText('Сервер 1')).toBeDefined();
    });
    fireEvent.click(screen.getByText('Сервер 1'));

    // Ждем загрузки данных
    await waitFor(() => {
      expect(screen.getByText('🔥 Самый выгодный квест')).toBeDefined();
    });

    // Проверяем лучший квест
    expect(screen.getByText('Тяньюя → ур. 4')).toBeDefined();
    expect(screen.getByText('6 зол. 14 сер.')).toBeDefined();
    expect(screen.getByText('+71.6%')).toBeDefined();

    // Проверяем другие рекомендации
    expect(screen.getByText('Другие рекомендации')).toBeDefined();
    expect(screen.getByText('Покоя → ур. 4')).toBeDefined();

    // Проверяем рекомендации для 1 уровня
    expect(screen.getByText('Рекомендации для 1 уровня души')).toBeDefined();
    expect(screen.getByText('1 зол. 19 сер.')).toBeDefined();
  });
});
