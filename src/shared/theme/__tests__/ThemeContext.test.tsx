import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, useTheme } from '../ThemeContext'

/** Тестовый компонент для проверки хука useTheme */
function ThemeConsumer() {
  const { theme, toggleTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>Переключить</button>
    </div>
  )
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('по умолчанию использует тёмную тему', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )
    expect(screen.getByTestId('theme').textContent).toBe('dark')
  })

  it('переключает тему при вызове toggleTheme', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )
    fireEvent.click(screen.getByText('Переключить'))
    expect(screen.getByTestId('theme').textContent).toBe('light')
  })

  it('устанавливает data-theme атрибут на html', () => {
    render(
      <ThemeProvider initialTheme="light">
        <ThemeConsumer />
      </ThemeProvider>,
    )
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('сохраняет тему в localStorage', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    )
    fireEvent.click(screen.getByText('Переключить'))
    expect(localStorage.getItem('pw-hub-theme')).toBe('light')
  })

  it('useTheme выбрасывает ошибку вне ThemeProvider', () => {
    expect(() => render(<ThemeConsumer />)).toThrow(
      'useTheme должен использоваться внутри ThemeProvider',
    )
  })
})
