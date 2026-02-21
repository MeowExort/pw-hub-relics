import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Tooltip } from '../Tooltip'

describe('Tooltip', () => {
  it('не показывает подсказку по умолчанию', () => {
    render(<Tooltip text="Подсказка"><span>Наведи</span></Tooltip>)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('показывает подсказку при наведении', () => {
    render(<Tooltip text="Подсказка"><span>Наведи</span></Tooltip>)
    fireEvent.mouseEnter(screen.getByText('Наведи').parentElement!)
    expect(screen.getByRole('tooltip')).toHaveTextContent('Подсказка')
  })

  it('скрывает подсказку при уходе курсора', () => {
    render(<Tooltip text="Подсказка"><span>Наведи</span></Tooltip>)
    const wrapper = screen.getByText('Наведи').parentElement!
    fireEvent.mouseEnter(wrapper)
    fireEvent.mouseLeave(wrapper)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
