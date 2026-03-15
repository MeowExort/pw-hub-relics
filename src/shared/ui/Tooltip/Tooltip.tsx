import { useState, type ReactNode } from 'react'
import clsx from 'clsx'
import styles from './Tooltip.module.scss'

interface TooltipProps {
  /** Содержимое подсказки */
  text: ReactNode
  /** Позиция подсказки */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** Оборачиваемый элемент */
  children: ReactNode
  /** Дополнительный CSS-класс */
  className?: string
}

/** Всплывающая подсказка при наведении */
export function Tooltip({ text, position = 'top', children, className }: TooltipProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div
      className={clsx(styles.wrapper, className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className={clsx(styles.tooltip, styles[position])} role="tooltip">
          {text}
        </div>
      )}
    </div>
  )
}
