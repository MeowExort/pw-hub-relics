import { useState, useRef, useEffect, useCallback } from 'react'
import clsx from 'clsx'
import type { AttributeFilterDto, AttributeDefinition } from '@/shared/types'
import styles from './AdditionalAttributesFilter.module.scss'

interface AttributeSelectProps {
  /** Список всех атрибутов */
  attributes: AttributeDefinition[]
  /** ID уже выбранных атрибутов */
  selectedIds: number[]
  /** Обработчик выбора атрибута */
  onSelect: (id: number) => void
}

/** Кастомный выпадающий список для выбора атрибута (замена нативного select) */
function AttributeSelect({ attributes, selectedIds, onSelect }: AttributeSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const available = attributes.filter((a) => !selectedIds.includes(a.id))

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = useCallback((id: number) => {
    onSelect(id)
    setOpen(false)
  }, [onSelect])

  return (
    <div className={styles.addSection} ref={ref}>
      <span className={styles.addLabel}>Добавить атрибут:</span>
      <button
        type="button"
        className={styles.addSelect}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={available.length === 0}
      >
        <span className={styles.addSelectText}>Выберите атрибут...</span>
        <span className={styles.addSelectArrow}>▾</span>
      </button>
      {open && available.length > 0 && (
        <ul className={styles.addDropdown} role="listbox">
          {available.map((a) => (
            <li
              key={a.id}
              className={styles.addOption}
              role="option"
              aria-selected={false}
              onClick={() => handleSelect(a.id)}
            >
              {a.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

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

          <AttributeSelect
            attributes={attributes}
            selectedIds={value.map((v) => v.id)}
            onSelect={addAttribute}
          />
        </div>
      )}
    </div>
  )
}
