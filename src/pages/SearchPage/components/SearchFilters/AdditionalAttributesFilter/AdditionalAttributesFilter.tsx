import { useState, useRef, useEffect } from 'react'
import clsx from 'clsx'
import { Button } from '@/shared/ui'
import type { AttributeFilterDto, AttributeDefinition } from '@/shared/types'
import styles from './AdditionalAttributesFilter.module.scss'

interface AdditionalAttributesFilterProps {
  /** Список доступных атрибутов */
  attributes: AttributeDefinition[]
  /** Текущие фильтры */
  value: AttributeFilterDto[]
  /** Обработчик изменения */
  onChange: (value: AttributeFilterDto[]) => void
  /** Дополнительный CSS-класс */
  className?: string
}

/** Компонент для фильтрации по дополнительным атрибутам с диапазонами */
export function AdditionalAttributesFilter({
  attributes,
  value,
  onChange,
  className,
}: AdditionalAttributesFilterProps) {
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

  const addAttribute = (id: number) => {
    if (value.some((v) => v.id === id)) return
    onChange([...value, { id, minValue: null, maxValue: null }])
  }

  const removeAttribute = (id: number) => {
    onChange(value.filter((v) => v.id !== id))
  }

  const updateAttribute = (id: number, patch: Partial<AttributeFilterDto>) => {
    onChange(
      value.map((v) => (v.id === id ? { ...v, ...patch } : v))
    )
  }

  const selectedCount = value.length
  const displayText = selectedCount > 0 ? `Атрибутов: ${selectedCount}` : 'Все'

  return (
    <div className={clsx(styles.wrapper, className)} ref={ref}>
      <span className={styles.label}>Доп. атрибуты</span>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className={clsx(styles.text, selectedCount === 0 && styles.placeholder)}>
          {displayText}
        </span>
        <span className={styles.arrow}>▾</span>
      </button>

      {open && (
        <div className={styles.dropdown}>
          <div className={styles.selectedList}>
            {value.map((v) => {
              const attr = attributes.find((a) => a.id === v.id)
              return (
                <div key={v.id} className={styles.attributeRow}>
                  <span className={styles.attrName} title={attr?.name}>
                    {attr?.name}
                  </span>
                  <div className={styles.rangeInputs}>
                    <input
                      type="number"
                      placeholder="От"
                      value={v.minValue ?? ''}
                      onChange={(e) =>
                        updateAttribute(v.id, {
                          minValue: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className={styles.input}
                    />
                    <span className={styles.separator}>—</span>
                    <input
                      type="number"
                      placeholder="До"
                      value={v.maxValue ?? ''}
                      onChange={(e) =>
                        updateAttribute(v.id, {
                          maxValue: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className={styles.input}
                    />
                  </div>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeAttribute(v.id)}
                    title="Удалить"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>

          <div className={styles.addSection}>
            <span className={styles.addLabel}>Добавить атрибут:</span>
            <select
              className={styles.addSelect}
              value=""
              onChange={(e) => addAttribute(Number(e.target.value))}
            >
              <option value="" disabled>
                Выберите атрибут...
              </option>
              {attributes
                .filter((a) => !value.some((v) => v.id === a.id))
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
