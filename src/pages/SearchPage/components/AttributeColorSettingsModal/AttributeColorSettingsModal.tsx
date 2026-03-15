import { useState, useMemo } from 'react'
import { Modal, Button, Select } from '@/shared/ui'
import { useAttributeStyles, useDictionaries } from '@/shared/hooks'
import type { AttributeColorRule } from '@/shared/types'
import styles from './AttributeColorSettingsModal.module.scss'

interface AttributeColorSettingsModalProps {
  /** Видимость окна */
  open: boolean
  /** Обработчик закрытия */
  onClose: () => void
}

/**
 * Модальное окно для настройки подсветки характеристик.
 */
export function AttributeColorSettingsModal({ open, onClose }: AttributeColorSettingsModalProps) {
  const { attributes } = useDictionaries()
  const { settings, updateSettings } = useAttributeStyles()

  // Состояние формы нового правила
  const [selectedAttrId, setSelectedAttrId] = useState<number | undefined>(undefined)
  const [minVal, setMinVal] = useState<string>('')
  const [maxVal, setMaxVal] = useState<string>('')
  const [color, setColor] = useState<string>('#ff0000')

  /** Список всех правил в плоском виде для удобства отображения */
  const flatRules = useMemo(() => {
    const result: Array<{ attrId: number; rule: AttributeColorRule }> = []
    Object.entries(settings.attributes).forEach(([attrId, rules]) => {
      rules.forEach(rule => {
        result.push({ attrId: Number(attrId), rule })
      })
    })
    return result.sort((a, b) => {
      const nameA = attributes.find(attr => attr.id === a.attrId)?.name || ''
      const nameB = attributes.find(attr => attr.id === b.attrId)?.name || ''
      return nameA.localeCompare(nameB)
    })
  }, [settings.attributes, attributes])

  /** Добавление нового правила */
  const handleAddRule = () => {
    if (!selectedAttrId) return

    const newRule: AttributeColorRule = {
      id: crypto.randomUUID(),
      min: minVal === '' ? null : Number(minVal),
      max: maxVal === '' ? null : Number(maxVal),
      color
    }

    const currentRules = settings.attributes[selectedAttrId] || []
    updateSettings({
      ...settings,
      attributes: {
        ...settings.attributes,
        [selectedAttrId]: [...currentRules, newRule]
      }
    })

    // Сброс полей (кроме атрибута и цвета для удобства серийного добавления)
    setMinVal('')
    setMaxVal('')
  }

  /** Удаление правила */
  const handleRemoveRule = (attrId: number, ruleId: string) => {
    const currentRules = settings.attributes[attrId] || []
    const updatedRules = currentRules.filter(r => r.id !== ruleId)
    
    const newAttributes = { ...settings.attributes }
    if (updatedRules.length === 0) {
      delete newAttributes[attrId]
    } else {
      newAttributes[attrId] = updatedRules
    }

    updateSettings({
      ...settings,
      attributes: newAttributes
    })
  }

  /** Сброс всех настроек */
  const handleResetAll = () => {
    if (confirm('Вы уверены, что хотите удалить ВСЕ правила подсветки?')) {
      updateSettings({ attributes: {} })
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Настройка подсветки характеристик" className={styles.modal}>
      <div className={styles.form}>
        <div className={styles.formRow}>
          <Select
            label="Характеристика"
            options={attributes.map(a => ({ value: a.id, label: a.name }))}
            value={selectedAttrId}
            onChange={(v) => setSelectedAttrId(v ? Number(v) : undefined)}
          />
          <div className={styles.inputGroup}>
            <label className={styles.label}>От</label>
            <input
              type="number"
              className={styles.input}
              value={minVal}
              onChange={e => setMinVal(e.target.value)}
              placeholder="Мин"
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>До</label>
            <input
              type="number"
              className={styles.input}
              value={maxVal}
              onChange={e => setMaxVal(e.target.value)}
              placeholder="Макс"
            />
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Цвет</label>
            <input
              type="color"
              className={`${styles.input} ${styles.colorInput}`}
              value={color}
              onChange={e => setColor(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={handleAddRule} disabled={!selectedAttrId} size="sm">
          Добавить правило
        </Button>
      </div>

      <div className={styles.rulesList}>
        {flatRules.length === 0 ? (
          <div className={styles.empty}>Правил пока нет</div>
        ) : (
          flatRules.map(({ attrId, rule }) => {
            const attr = attributes.find(a => a.id === attrId)
            return (
              <div key={rule.id} className={styles.ruleItem}>
                <div className={styles.ruleInfo}>
                  <span className={styles.attrName}>{attr?.name || `ID: ${attrId}`}</span>
                  <span className={styles.range}>
                    {rule.min !== null && `от ${rule.min}`}
                    {rule.min !== null && rule.max !== null && ' '}
                    {rule.max !== null && `до ${rule.max}`}
                    {rule.min === null && rule.max === null && 'Любое значение'}
                  </span>
                </div>
                <div 
                  className={styles.colorPreview} 
                  style={{ backgroundColor: rule.color }}
                  title={rule.color}
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleRemoveRule(attrId, rule.id)}
                  aria-label="Удалить"
                >
                  ✕
                </Button>
              </div>
            )
          })
        )}
      </div>

      <div className={styles.footer}>
        {flatRules.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleResetAll}>
            Сбросить всё
          </Button>
        )}
      </div>
    </Modal>
  )
}
