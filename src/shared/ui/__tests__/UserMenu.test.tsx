import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider } from '@/shared/theme'
import { UserMenu } from '../UserMenu'

vi.mock('@/shared/api/auth', () => ({
  logout: vi.fn(),
}))

import { logout } from '@/shared/api/auth'

/** Обёртка с ThemeProvider для тестов */
function renderWithTheme() {
  return render(
    <ThemeProvider>
      <UserMenu />
    </ThemeProvider>,
  )
}

describe('UserMenu', () => {
  beforeEach(() => {
    vi.mocked(logout).mockReset()
  })

  it('рендерит кнопку-триггер меню', () => {
    renderWithTheme()
    expect(screen.getByLabelText('Меню пользователя')).toBeInTheDocument()
  })

  it('открывает dropdown при клике', () => {
    renderWithTheme()
    fireEvent.click(screen.getByLabelText('Меню пользователя'))
    expect(screen.getByText('Светлая тема')).toBeInTheDocument()
    expect(screen.getByText('Выйти')).toBeInTheDocument()
  })

  it('переключает тему при клике на пункт темы', () => {
    renderWithTheme()
    fireEvent.click(screen.getByLabelText('Меню пользователя'))
    fireEvent.click(screen.getByText('Светлая тема'))
    // После переключения текст меняется
    expect(screen.getByText('Тёмная тема')).toBeInTheDocument()
  })

  it('вызывает logout при клике на «Выйти»', () => {
    renderWithTheme()
    fireEvent.click(screen.getByLabelText('Меню пользователя'))
    fireEvent.click(screen.getByText('Выйти'))
    expect(logout).toHaveBeenCalledOnce()
  })

  it('закрывает dropdown при клике вне меню', () => {
    renderWithTheme()
    fireEvent.click(screen.getByLabelText('Меню пользователя'))
    expect(screen.getByText('Выйти')).toBeInTheDocument()
    // Клик вне меню
    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('Выйти')).not.toBeInTheDocument()
  })
})
