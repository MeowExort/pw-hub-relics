import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('рендерит текст кнопки', () => {
    render(<Button>Нажми</Button>)
    expect(screen.getByRole('button', { name: 'Нажми' })).toBeInTheDocument()
  })

  it('вызывает onClick при клике', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Клик</Button>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('блокируется при disabled', () => {
    render(<Button disabled>Заблокирована</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('блокируется при loading', () => {
    render(<Button loading>Загрузка</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('не показывает текст при loading', () => {
    render(<Button loading>Текст</Button>)
    expect(screen.getByRole('button')).not.toHaveTextContent('Текст')
  })
})
