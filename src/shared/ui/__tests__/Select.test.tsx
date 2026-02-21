import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Select } from '../Select'

const options = [
  { value: 1, label: 'Первый' },
  { value: 2, label: 'Второй' },
  { value: 3, label: 'Третий' },
]

describe('Select', () => {
  it('рендерит подпись', () => {
    render(<Select label="Сервер" options={options} value={undefined} onChange={() => {}} />)
    expect(screen.getByText('Сервер')).toBeInTheDocument()
  })

  it('отображает плейсхолдер когда значение не выбрано', () => {
    render(<Select options={options} value={undefined} onChange={() => {}} />)
    expect(screen.getByText('Все')).toBeInTheDocument()
  })

  it('открывает выпадающий список при клике', () => {
    render(<Select options={options} value={undefined} onChange={() => {}} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(4) // плейсхолдер + 3
  })

  it('вызывает onChange при выборе опции', () => {
    const onChange = vi.fn()
    render(<Select options={options} value={undefined} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByText('Второй'))
    expect(onChange).toHaveBeenCalledWith('2')
  })

  it('отображает текущее значение', () => {
    render(<Select options={options} value={2} onChange={() => {}} />)
    expect(screen.getByText('Второй')).toBeInTheDocument()
  })

  it('показывает пользовательский плейсхолдер', () => {
    render(
      <Select options={options} value={undefined} onChange={() => {}} placeholder="Выберите" />,
    )
    expect(screen.getByText('Выберите')).toBeInTheDocument()
  })

  it('закрывает список после выбора', () => {
    render(<Select options={options} value={undefined} onChange={() => {}} />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Первый'))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('вызывает onChange с пустой строкой при выборе плейсхолдера', () => {
    const onChange = vi.fn()
    render(<Select options={options} value={1} onChange={onChange} placeholder="Все" />)
    fireEvent.click(screen.getByRole('button'))
    fireEvent.click(screen.getByRole('option', { name: 'Все' }))
    expect(onChange).toHaveBeenCalledWith('')
  })
})
