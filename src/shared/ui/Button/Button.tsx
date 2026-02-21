import { type ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'
import styles from './Button.module.scss'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Вариант кнопки */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  /** Размер кнопки */
  size?: 'sm' | 'md' | 'lg'
  /** Состояние загрузки */
  loading?: boolean
}

/** Базовая кнопка дизайн-системы */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(styles.button, styles[variant], styles[size], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className={styles.loader} /> : children}
    </button>
  )
}
