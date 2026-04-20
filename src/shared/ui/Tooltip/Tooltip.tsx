import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
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

/** Всплывающая подсказка при наведении. Рендерится в portal с фиксированным позиционированием, чтобы не обрезаться родителями. */
export function Tooltip({ text, position = 'top', children, className }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 })

  useLayoutEffect(() => {
    if (!visible || !wrapperRef.current || !tooltipRef.current) return
    const anchor = wrapperRef.current.getBoundingClientRect()
    const tip = tooltipRef.current.getBoundingClientRect()
    const gap = 6
    const margin = 8
    // Авто-флип вертикальной позиции, если не помещается в viewport
    let effectivePosition = position
    if (position === 'top' && anchor.top - tip.height - gap < margin) {
      if (anchor.bottom + tip.height + gap <= window.innerHeight - margin) {
        effectivePosition = 'bottom'
      }
    } else if (position === 'bottom' && anchor.bottom + tip.height + gap > window.innerHeight - margin) {
      if (anchor.top - tip.height - gap >= margin) {
        effectivePosition = 'top'
      }
    }
    let top = 0
    let left = 0
    switch (effectivePosition) {
      case 'top':
        top = anchor.top - tip.height - gap
        left = anchor.left + anchor.width / 2 - tip.width / 2
        break
      case 'bottom':
        top = anchor.bottom + gap
        left = anchor.left + anchor.width / 2 - tip.width / 2
        break
      case 'left':
        top = anchor.top + anchor.height / 2 - tip.height / 2
        left = anchor.left - tip.width - gap
        break
      case 'right':
        top = anchor.top + anchor.height / 2 - tip.height / 2
        left = anchor.right + gap
        break
    }
    // Удерживаем тултип в пределах viewport по горизонтали и вертикали
    const maxLeft = window.innerWidth - tip.width - margin
    if (left < margin) left = margin
    if (left > maxLeft) left = maxLeft
    const maxTop = window.innerHeight - tip.height - margin
    if (top < margin) top = margin
    if (top > maxTop) top = maxTop
    setCoords({ top, left })
  }, [visible, position, text])

  return (
    <div
      ref={wrapperRef}
      className={clsx(styles.wrapper, className)}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible &&
        createPortal(
          <div
            ref={tooltipRef}
            className={clsx(styles.tooltip, styles[position])}
            role="tooltip"
            style={{ top: coords.top, left: coords.left }}
          >
            {text}
          </div>,
          document.body,
        )}
    </div>
  )
}
