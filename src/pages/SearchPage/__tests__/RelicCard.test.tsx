import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RelicCard } from '../components/RelicCard'
import type { RelicListItem } from '@/shared/types'

const mockRelic: RelicListItem = {
  id: 'relic-1',
  relicDefinition: {
    id: 1010256,
    name: 'Снежный указ (2 ур.)',
    soulLevel: 2,
    soulType: 2,
    slotType: { id: 3, name: 'Зеркало честности' },
    race: 3,
    iconUri: 'https://cdn.pw-hub.ru/relics/icons/test.png',
  },
  absorbExperience: 2000,
  mainAttribute: {
    attributeDefinition: { id: 36, name: 'Мана' },
    value: 100,
  },
  additionalAttributes: [
    { attributeDefinition: { id: 50, name: 'Уклонение' }, value: 4 },
  ],
  enhancementLevel: 3,
  price: 460,
  priceFormatted: '4 зол. 60 сер.',
  server: { id: 3, name: 'Алькор', key: 'alkor' },
  createdAt: '2026-02-20T16:47:34.608182Z',
}

function renderCard(relic = mockRelic, view: 'grid' | 'list' = 'grid') {
  return render(
    <MemoryRouter>
      <RelicCard relic={relic} view={view} />
    </MemoryRouter>,
  )
}

describe('RelicCard', () => {
  it('рендерит название реликвии без суффикса уровня', () => {
    renderCard()
    expect(screen.getByText('Снежный указ')).toBeInTheDocument()
    expect(screen.queryByText(/\(2 ур\.\)/)).not.toBeInTheDocument()
  })

  it('рендерит уровень души с правильным классом', () => {
    renderCard()
    const badge = screen.getByText('Ур. 2')
    expect(badge).toHaveClass(/soulLevel2/)
  })

  it('рендерит бейдж заточки', () => {
    renderCard()
    expect(screen.getByText('+3')).toBeInTheDocument()
  })

  it('не рендерит бейдж заточки при уровне 0', () => {
    renderCard({ ...mockRelic, enhancementLevel: 0 })
    expect(screen.queryByText('+0')).not.toBeInTheDocument()
  })

  it('рендерит основной атрибут', () => {
    renderCard()
    expect(screen.getByText('Мана')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
  })

  it('рендерит дополнительные атрибуты', () => {
    renderCard()
    expect(screen.getByText('Уклонение')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('рендерит форматированную цену', () => {
    renderCard()
    expect(screen.getByText('4 зол. 60 сер.')).toBeInTheDocument()
  })

  it('рендерит название сервера', () => {
    renderCard()
    expect(screen.getByText('Алькор')).toBeInTheDocument()
  })

  it('рендерит иконку реликвии', () => {
    renderCard()
    const img = screen.getByAltText('Снежный указ')
    expect(img).toHaveAttribute('src', 'https://cdn.pw-hub.ru/relics/icons/test.png')
  })

  it('ссылается на детальную страницу', () => {
    renderCard()
    const link = screen.getByTestId('relic-card')
    expect(link).toHaveAttribute('href', '/relics/relic-1')
  })
})
