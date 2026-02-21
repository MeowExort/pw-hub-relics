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

  it('рендерит все опции и плейсхолдер', () => {
    render(<Select options={options} value={undefined} onChange={() => {}} />)
    const selectEl = screen.getByRole('combobox')
    expect(selectEl).toBeInTheDocument()
    expect(selectEl.querySelectorAll('option')).toHaveLength(4) // placeholder + 3
  })

  it('вызывает onChange при выборе', () => {
    const onChange = vi.fn()
    render(<Select options={options} value={undefined} onChange={onChange} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '2' } })
    expect(onChange).toHaveBeenCalledWith('2')
  })

  it('отображает текущее значение', () => {
    render(<Select options={options} value={2} onChange={() => {}} />)
    expect(screen.getByRole('combobox')).toHaveValue('2')
  })

  it('показывает пользовательский плейсхолдер', () => {
    render(
      <Select options={options} value={undefined} onChange={() => {}} placeholder="Выберите" />,
    )
    expect(screen.getByText('Выберите')).toBeInTheDocument()
  })
})
