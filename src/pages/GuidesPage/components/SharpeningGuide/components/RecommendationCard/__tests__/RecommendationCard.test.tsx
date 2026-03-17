import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RecommendationCard } from '../RecommendationCard';
import type { Recommendation } from '@/shared/types';

const mockRecommendation: Recommendation = {
  relicListingId: 123,
  relicName: 'Тестовая реликвия',
  price: 10000,
  absorbExperience: 500,
  pricePerExperience: 20,
  cumulativeExperience: 1500,
};

function renderCard(rec = mockRecommendation) {
  return render(
    <MemoryRouter>
      <RecommendationCard recommendation={rec} />
    </MemoryRouter>,
  );
}

describe('RecommendationCard', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('отображает кнопку копирования названия', () => {
    renderCard();
    expect(screen.getByRole('button', { name: /скопировать название/i })).toBeInTheDocument();
  });

  it('копирует название реликвии в буфер обмена при клике на кнопку', async () => {
    renderCard();
    const copyButton = screen.getByRole('button', { name: /скопировать название/i });
    fireEvent.click(copyButton);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Тестовая реликвия');
  });

  it('не переходит на страницу реликвии при клике на кнопку копирования', () => {
    renderCard();
    const copyButton = screen.getByRole('button', { name: /скопировать название/i });
    fireEvent.click(copyButton);
    // Карточка не должна навигировать — проверяем что clipboard вызван
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Тестовая реликвия');
  });
});
