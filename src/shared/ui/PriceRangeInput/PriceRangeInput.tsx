import clsx from 'clsx'
import styles from './PriceRangeInput.module.scss'

interface PriceRangeInputProps {
  /** Подпись */
  label?: string
  /** Минимальная цена */
  min: string
  /** Максимальная цена */
  max: string
  /** Обработчик изменения минимальной цены */
  onMinChange: (value: string) => void
  /** Обработчик изменения максимальной цены */
  onMaxChange: (value: string) => void
  /** Дополнительный CSS-класс */
  className?: string
}

/** Ввод диапазона цен */
export function PriceRangeInput({
  label,
  min,
  max,
  onMinChange,
  onMaxChange,
  className,
}: PriceRangeInputProps) {
  return (
    <div className={clsx(styles.wrapper, className)}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.fields}>
        <input
          type="number"
          className={styles.input}
          placeholder="От"
          value={min}
          onChange={(e) => onMinChange(e.target.value)}
          min={0}
          aria-label="Минимальная цена"
        />
        <span className={styles.separator}>—</span>
        <input
          type="number"
          className={styles.input}
          placeholder="До"
          value={max}
          onChange={(e) => onMaxChange(e.target.value)}
          min={0}
          aria-label="Максимальная цена"
        />
      </div>
    </div>
  )
}
