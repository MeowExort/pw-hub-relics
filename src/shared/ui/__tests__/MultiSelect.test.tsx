import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MultiSelect } from '../MultiSelect'

const options = [
  { value: 1, label: 'Здоровье' },
  { value: 2, label: 'Мана' },
  { value: 3, label: 'Защита' },
]

describe('MultiSelect', () => {
  it('рендерит подпись', () => {
    render(<MultiSelect label="Доп. атрибуты" options={options} value={[]} onChange={() => {}} />)
    expect(screen.getByText('Доп. атрибуты')).toBeInTheDocument()
  })

  it('показывает плейсхолдер при пустом выборе', () => {
    render(<MultiSelect options={options} value={[]} onChange={() => {}} />)
    expect(screen.getByText('Все')).toBeInTheDocument()
  })

  it('показывает выбранные значения', () => {
    render(<MultiSelect options={options} value={[1, 3]} onChange={() => {}} />)
    expect(screen.getByText('Здоровье, Защита')).toBeInTheDocument()
  })

  it('показывает счётчик при >2 выбранных', () => {
    render(<MultiSelect options={options} value={[1, 2, 3]} onChange={() => {}} />)
    expect(screen.getByText('3 выбрано')).toBeInTheDocument()
  })

  it('открывает выпадающий список по клику', () => {
    render(<MultiSelect options={options} value={[]} onChange={() => {}} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByText('Здоровье')).toBeInTheDocument()
  })

  it('вызывает onChange при выборе опции', () => {
    const onChange = vi.fn()
    render(<MultiSelect options={options} value={[]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByText('Мана'))
    expect(onChange).toHaveBeenCalledWith([2])
  })

  it('вызывает onChange при снятии выбора', () => {
    const onChange = vi.fn()
    render(<MultiSelect options={options} value={[1, 2]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByText('Здоровье'))
    expect(onChange).toHaveBeenCalledWith([2])
  })
})
