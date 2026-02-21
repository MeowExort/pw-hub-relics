import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '../ProtectedRoute'

vi.mock('@/shared/api/auth', () => ({
  isAuthenticated: vi.fn(() => false),
}))

import { isAuthenticated } from '@/shared/api/auth'

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.mocked(isAuthenticated).mockReset()
  })

  it('показывает содержимое если пользователь авторизован', () => {
    vi.mocked(isAuthenticated).mockReturnValue(true)
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Защищённый контент</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Защищённый контент')).toBeInTheDocument()
  })

  it('перенаправляет на / если пользователь не авторизован', () => {
    vi.mocked(isAuthenticated).mockReturnValue(false)
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/" element={<div>Главная</div>} />
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Защищённый контент</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByText('Главная')).toBeInTheDocument()
    expect(screen.queryByText('Защищённый контент')).not.toBeInTheDocument()
  })
})
