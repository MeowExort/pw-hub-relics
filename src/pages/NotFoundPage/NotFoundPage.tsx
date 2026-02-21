import { Link } from 'react-router-dom'

/** Страница 404 */
export function NotFoundPage() {
  return (
    <div>
      <h1>404</h1>
      <p>Страница не найдена.</p>
      <Link to="/">Вернуться на главную</Link>
    </div>
  )
}
