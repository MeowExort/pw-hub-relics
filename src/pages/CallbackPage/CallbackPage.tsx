import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { exchangeCodeForTokens } from '@/shared/api/auth'
import { Spinner } from '@/shared/ui/Spinner'

/**
 * Страница обработки callback после OIDC-авторизации.
 * Обменивает authorization code на токены и перенаправляет на главную.
 */
export function CallbackPage() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setError('Код авторизации не найден')
      return
    }

    exchangeCodeForTokens(code).then((tokens) => {
      if (tokens) {
        // Полная перезагрузка для обновления состояния авторизации во всех компонентах
        window.location.href = '/'
      } else {
        setError('Не удалось завершить авторизацию')
      }
    })
  }, [searchParams])

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
        <p style={{ color: 'var(--danger)' }}>{error}</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2xl)' }}>
      <Spinner />
    </div>
  )
}
