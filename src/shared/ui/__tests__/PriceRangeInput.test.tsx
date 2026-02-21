import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PriceRangeInput } from '../PriceRangeInput'

describe('PriceRangeInput', () => {
  it('рендерит подпись', () => {
    render(
      <PriceRangeInput label="Цена" min="" max="" onMinChange={() => {}} onMaxChange={() => {}} />,
    )
    expect(screen.getByText('Цена')).toBeInTheDocument()
  })

  it('рендерит два поля ввода', () => {
    render(
      <PriceRangeInput min="" max="" onMinChange={() => {}} onMaxChange={() => {}} />,
    )
    expect(screen.getByLabelText('Минимальная цена')).toBeInTheDocument()
    expect(screen.getByLabelText('Максимальная цена')).toBeInTheDocument()
  })

  it('вызывает onMinChange при вводе', () => {
    const onMinChange = vi.fn()
    render(
      <PriceRangeInput min="" max="" onMinChange={onMinChange} onMaxChange={() => {}} />,
    )
    fireEvent.change(screen.getByLabelText('Минимальная цена'), { target: { value: '100' } })
    expect(onMinChange).toHaveBeenCalledWith('100')
  })

  it('вызывает onMaxChange при вводе', () => {
    const onMaxChange = vi.fn()
    render(
      <PriceRangeInput min="" max="" onMinChange={() => {}} onMaxChange={onMaxChange} />,
    )
    fireEvent.change(screen.getByLabelText('Максимальная цена'), { target: { value: '500' } })
    expect(onMaxChange).toHaveBeenCalledWith('500')
  })

  it('отображает текущие значения', () => {
    render(
      <PriceRangeInput min="100" max="500" onMinChange={() => {}} onMaxChange={() => {}} />,
    )
    expect(screen.getByLabelText('Минимальная цена')).toHaveValue(100)
    expect(screen.getByLabelText('Максимальная цена')).toHaveValue(500)
  })
})
