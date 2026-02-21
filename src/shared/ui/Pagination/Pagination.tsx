import clsx from 'clsx'
import styles from './Pagination.module.scss'

interface PaginationProps {
  /** Текущая страница (начиная с 1) */
  page: number
  /** Общее количество страниц */
  totalPages: number
  /** Обработчик смены страницы */
  onPageChange: (page: number) => void
  /** Дополнительный CSS-класс */
  className?: string
}

/** Вычисляет видимые номера страниц с многоточиями */
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = [1]

  if (current > 3) pages.push('...')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) pages.push('...')

  pages.push(total)
  return pages
}

/** Компонент пагинации */
export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = getPageNumbers(page, totalPages)

  return (
    <nav className={clsx(styles.pagination, className)} aria-label="Пагинация">
      <button
        className={styles.button}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Предыдущая страница"
      >
        ‹
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className={styles.ellipsis}>
            …
          </span>
        ) : (
          <button
            key={p}
            className={clsx(styles.button, p === page && styles.active)}
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            aria-label={`Страница ${p}`}
          >
            {p}
          </button>
        ),
      )}

      <button
        className={styles.button}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Следующая страница"
      >
        ›
      </button>
    </nav>
  )
}
