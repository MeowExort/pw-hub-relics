import { type SelectHTMLAttributes } from 'react'
import clsx from 'clsx'
import styles from './Select.module.scss'

export interface SelectOption {
  /** Значение опции */
  value: string | number
  /** Отображаемый текст */
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  /** Подпись */
  label?: string
  /** Список опций */
  options: SelectOption[]
  /** Текущее значение */
  value: string | number | undefined
  /** Обработчик изменения */
  onChange: (value: string) => void
  /** Текст пустой опции */
  placeholder?: string
  /** Дополнительный CSS-класс */
  className?: string
}

/** Выпадающий список */
export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = 'Все',
  className,
  ...rest
}: SelectProps) {
  return (
    <div className={clsx(styles.select, className)}>
      {label && <span className={styles.label}>{label}</span>}
      <select
        className={styles.field}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label || placeholder}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
