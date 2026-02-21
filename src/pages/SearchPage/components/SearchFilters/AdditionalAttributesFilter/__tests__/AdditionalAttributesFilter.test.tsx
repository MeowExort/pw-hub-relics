import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AdditionalAttributesFilter } from '../AdditionalAttributesFilter'
import type { AttributeDefinition, AttributeFilterDto } from '@/shared/types'

const mockAttributes: AttributeDefinition[] = [
  { id: 1, name: 'Сила' },
  { id: 2, name: 'Ловкость' },
  { id: 3, name: 'Интеллект' },
]

describe('AdditionalAttributesFilter', () => {
  it('отображает "Все", если ничего не выбрано', () => {
    render(
      <AdditionalAttributesFilter
        attributes={mockAttributes}
        value={[]}
        onChange={() => {}}
      />
    )
    expect(screen.getByText('Все')).toBeInTheDocument()
  })

  it('открывает выпадающий список при клике', () => {
    render(
      <AdditionalAttributesFilter
        attributes={mockAttributes}
        value={[]}
        onChange={() => {}}
      />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Добавить атрибут:')).toBeInTheDocument()
  })

  it('позволяет добавить атрибут', () => {
    const onChange = vi.fn()
    render(
      <AdditionalAttributesFilter
        attributes={mockAttributes}
        value={[]}
        onChange={onChange}
      />
    )
    // Открываем основной dropdown
    fireEvent.click(screen.getByRole('button'))
    // Открываем кастомный select атрибутов
    fireEvent.click(screen.getByText('Выберите атрибут...'))
    // Выбираем атрибут из списка
    fireEvent.click(screen.getByText('Сила'))
    
    expect(onChange).toHaveBeenCalledWith([{ id: 1, minValue: null, maxValue: null }])
  })

  it('отображает выбранные атрибуты с полями ввода', () => {
    const value: AttributeFilterDto[] = [{ id: 1, minValue: 10, maxValue: 20 }]
    render(
      <AdditionalAttributesFilter
        attributes={mockAttributes}
        value={value}
        onChange={() => {}}
      />
    )
    fireEvent.click(screen.getByRole('button'))
    
    expect(screen.getByText('Сила')).toBeInTheDocument()
    expect(screen.getByDisplayValue('10')).toBeInTheDocument()
    expect(screen.getByDisplayValue('20')).toBeInTheDocument()
  })

  it('позволяет изменить значения диапазона', () => {
    const onChange = vi.fn()
    const value: AttributeFilterDto[] = [{ id: 1, minValue: null, maxValue: null }]
    render(
      <AdditionalAttributesFilter
        attributes={mockAttributes}
        value={value}
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByRole('button'))
    
    const inputs = screen.getAllByRole('spinbutton')
    fireEvent.change(inputs[0], { target: { value: '15' } })
    
    expect(onChange).toHaveBeenCalledWith([{ id: 1, minValue: 15, maxValue: null }])
  })

  it('позволяет удалить атрибут', () => {
    const onChange = vi.fn()
    const value: AttributeFilterDto[] = [{ id: 1, minValue: null, maxValue: null }]
    render(
      <AdditionalAttributesFilter
        attributes={mockAttributes}
        value={value}
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByTitle('Удалить'))
    
    expect(onChange).toHaveBeenCalledWith([])
  })
})
