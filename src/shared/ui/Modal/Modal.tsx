import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import styles from './Modal.module.scss'

interface ModalProps {
  /** Видимость модального окна */
  open: boolean
  /** Обработчик закрытия */
  onClose: () => void
  /** Заголовок */
  title?: string
  /** Содержимое */
  children: ReactNode
  /** Дополнительный CSS-класс */
  className?: string
}

/** Модальное окно с оверлеем и закрытием по Escape */
export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      if (!dialog.open) dialog.showModal()
    } else {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  /** Закрытие по клику на оверлей */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === dialogRef.current) {
      onClose()
    }
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      className={clsx(styles.modal, className)}
      onClick={handleBackdropClick}
      aria-label={title}
    >
      <div className={styles.content}>
        {title && (
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button className={styles.close} onClick={onClose} aria-label="Закрыть">
              ✕
            </button>
          </div>
        )}
        <div className={styles.body}>{children}</div>
      </div>
    </dialog>,
    document.body,
  )
}
