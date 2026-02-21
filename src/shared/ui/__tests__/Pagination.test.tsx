import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Pagination } from '../Pagination'

describe('Pagination', () => {
  it('не рендерится при totalPages <= 1', () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={() => {}} />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('рендерит кнопки страниц', () => {
    render(<Pagination page={1} totalPages={3} onPageChange={() => {}} />)
    expect(screen.getByLabelText('Страница 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Страница 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Страница 3')).toBeInTheDocument()
  })

  it('блокирует кнопку "Предыдущая" на первой странице', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={() => {}} />)
    expect(screen.getByLabelText('Предыдущая страница')).toBeDisabled()
  })

  it('блокирует кнопку "Следующая" на последней странице', () => {
    render(<Pagination page={5} totalPages={5} onPageChange={() => {}} />)
    expect(screen.getByLabelText('Следующая страница')).toBeDisabled()
  })

  it('вызывает onPageChange при клике на страницу', () => {
    const onPageChange = vi.fn()
    render(<Pagination page={1} totalPages={5} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByLabelText('Страница 3'))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('вызывает onPageChange при клике на "Следующая"', () => {
    const onPageChange = vi.fn()
    render(<Pagination page={2} totalPages={5} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByLabelText('Следующая страница'))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('отмечает текущую страницу aria-current', () => {
    render(<Pagination page={2} totalPages={5} onPageChange={() => {}} />)
    expect(screen.getByLabelText('Страница 2')).toHaveAttribute('aria-current', 'page')
    expect(screen.getByLabelText('Страница 1')).not.toHaveAttribute('aria-current')
  })
})
