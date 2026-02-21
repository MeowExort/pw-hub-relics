import { useState, useRef, useEffect, useCallback } from 'react'
import clsx from 'clsx'
import styles from './Select.module.scss'

export interface SelectOption {
  /** Значение опции */
  value: string | number
  /** Отображаемый текст */
  label: string
}

interface SelectProps {
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
  /** Заблокирован ли компонент */
  disabled?: boolean
}

/** Кастомный выпадающий список с поддержкой тёмной темы */
export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = 'Все',
  className,
  disabled,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((o) => String(o.value) === String(value))
  const displayText = selectedOption ? selectedOption.label : placeholder

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = useCallback(
    (val: string) => {
      onChange(val)
      setOpen(false)
    },
    [onChange],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    },
    [],
  )

  const handleOptionKeyDown = useCallback(
    (e: React.KeyboardEvent, val: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleSelect(val)
      }
    },
    [handleSelect],
  )

  return (
    <div className={clsx(styles.select, className)} ref={ref}>
      {label && <span className={styles.label}>{label}</span>}
      <button
        type="button"
        className={styles.field}
        onClick={() => !disabled && setOpen(!open)}
        onKeyDown={handleKeyDown}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label || placeholder}
        disabled={disabled}
      >
        <span className={clsx(styles.text, !selectedOption && styles.placeholder)}>
          {displayText}
        </span>
        <span className={styles.arrow}>▾</span>
      </button>
      {open && (
        <ul className={styles.dropdown} role="listbox">
          <li
            className={clsx(styles.option, !value && styles.optionSelected)}
            role="option"
            aria-selected={!value}
            onClick={() => handleSelect('')}
            onKeyDown={(e) => handleOptionKeyDown(e, '')}
            tabIndex={0}
          >
            {placeholder}
          </li>
          {options.map((opt) => (
            <li
              key={opt.value}
              className={clsx(
                styles.option,
                String(opt.value) === String(value) && styles.optionSelected,
              )}
              role="option"
              aria-selected={String(opt.value) === String(value)}
              onClick={() => handleSelect(String(opt.value))}
              onKeyDown={(e) => handleOptionKeyDown(e, String(opt.value))}
              tabIndex={0}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
