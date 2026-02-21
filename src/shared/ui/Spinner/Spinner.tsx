import clsx from 'clsx'
import styles from './Spinner.module.scss'

interface SpinnerProps {
  /** Размер спиннера */
  size?: 'sm' | 'md' | 'lg'
  /** Дополнительный CSS-класс */
  className?: string
}

/** Индикатор загрузки */
export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={clsx(styles.spinner, styles[size], className)}
      role="status"
      aria-label="Загрузка"
    >
      <span className="visually-hidden">Загрузка...</span>
    </div>
  )
}
