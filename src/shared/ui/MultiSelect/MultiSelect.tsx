import { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'
import type { SelectOption } from '../Select/Select'
import styles from './MultiSelect.module.scss'

interface MultiSelectProps {
  /** Подпись */
  label?: string
  /** Список опций */
  options: SelectOption[]
  /** Текущие выбранные значения */
  value: (string | number)[]
  /** Обработчик изменения */
  onChange: (value: (string | number)[]) => void
  /** Текст при пустом выборе */
  placeholder?: string
  /** Дополнительный CSS-класс */
  className?: string
}

/** Выпадающий список с множественным выбором */
export function MultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'Все',
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggle = (optValue: string | number) => {
    const strVal = String(optValue)
    const exists = value.some((v) => String(v) === strVal)
    if (exists) {
      onChange(value.filter((v) => String(v) !== strVal))
    } else {
      onChange([...value, optValue])
    }
  }

  const selectedLabels = options
    .filter((opt) => value.some((v) => String(v) === String(opt.value)))
    .map((opt) => opt.label)

  const displayText = selectedLabels.length > 0
    ? selectedLabels.length <= 2
      ? selectedLabels.join(', ')
      : `${selectedLabels.length} выбрано`
    : placeholder

  return (
    <div className={clsx(styles.multiSelect, className)} ref={ref}>
      {label && <span className={styles.label}>{label}</span>}
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={clsx(styles.text, value.length === 0 && styles.placeholder)}>
          {displayText}
        </span>
        <span className={styles.arrow}>▾</span>
      </button>
      {open && (
        <div className={styles.dropdown} role="listbox" aria-multiselectable="true">
          {options.map((opt) => {
            const checked = value.some((v) => String(v) === String(opt.value))
            return (
              <label key={opt.value} className={clsx(styles.option, checked && styles.checked)}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt.value)}
                  className={styles.checkbox}
                />
                <span>{opt.label}</span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
