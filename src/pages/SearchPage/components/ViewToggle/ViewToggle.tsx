import clsx from 'clsx'
import styles from './ViewToggle.module.scss'

type ViewMode = 'grid' | 'list'

interface ViewToggleProps {
  /** Текущий режим */
  value: ViewMode
  /** Обработчик смены режима */
  onChange: (mode: ViewMode) => void
}

/** Переключатель режима отображения (сетка / список) */
export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className={styles.toggle} role="radiogroup" aria-label="Режим отображения">
      <button
        className={clsx(styles.button, value === 'grid' && styles.active)}
        onClick={() => onChange('grid')}
        aria-pressed={value === 'grid'}
        aria-label="Сетка"
        title="Сетка"
      >
        ▦
      </button>
      <button
        className={clsx(styles.button, value === 'list' && styles.active)}
        onClick={() => onChange('list')}
        aria-pressed={value === 'list'}
        aria-label="Список"
        title="Список"
      >
        ☰
      </button>
    </div>
  )
}
