import styles from './Toggle.module.scss'

interface ToggleProps {
  /** Текущее состояние переключателя */
  checked: boolean
  /** Обработчик изменения состояния */
  onChange: (checked: boolean) => void
  /** Заблокировать переключатель */
  disabled?: boolean
  /** Подпись для доступности */
  'aria-label'?: string
}

/** Переключатель (toggle switch) */
export function Toggle({ checked, onChange, disabled, 'aria-label': ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`${styles.toggle} ${checked ? styles.checked : ''}`}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className={styles.thumb} />
    </button>
  )
}
