import { useState, useMemo, useCallback } from 'react'
import { Modal, Button, Select } from '@/shared/ui'
import { useAttributeStyles, useDictionaries } from '@/shared/hooks'
import { presetService } from '@/shared/lib/presetService'
import type { AttributeColorRule, AttributeColorPreset } from '@/shared/types'
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

  // Состояние формы нового/редактируемого правила
  const [selectedAttrId, setSelectedAttrId] = useState<number | undefined>(undefined)
  const [minVal, setMinVal] = useState<string>('')
  const [maxVal, setMaxVal] = useState<string>('')
  const [color, setColor] = useState<string>('#ff0000')

  // Состояние редактирования: attrId и ruleId редактируемого правила
  const [editingAttrId, setEditingAttrId] = useState<number | null>(null)
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null)

  // Пресеты
  const [presets, setPresets] = useState<AttributeColorPreset[]>(() => presetService.getPresets())
  const [presetName, setPresetName] = useState('')
  const [importValue, setImportValue] = useState('')

  /** Обновить список пресетов из localStorage */
  const refreshPresets = useCallback(() => {
    setPresets(presetService.getPresets())
  }, [])

  /** Сохранить текущие настройки как пресет */
  const handleSavePreset = () => {
    const name = presetName.trim()
    if (!name) return
    presetService.savePreset(name, settings)
    setPresetName('')
    refreshPresets()
  }

  /** Загрузить пресет (применить его настройки) */
  const handleLoadPreset = (preset: AttributeColorPreset) => {
    updateSettings(preset.settings)
  }

  /** Удалить пресет */
  const handleDeletePreset = (id: string) => {
    presetService.deletePreset(id)
    refreshPresets()
  }

  /** Экспорт текущих настроек в буфер обмена (base64) */
  const handleExport = async () => {
    const base64 = presetService.exportSettings(settings)
    await navigator.clipboard.writeText(base64)
    alert('Настройки скопированы в буфер обмена')
  }

  /** Импорт настроек из base64-строки */
  const handleImport = () => {
    const imported = presetService.importSettings(importValue)
    if (imported) {
      updateSettings(imported)
      setImportValue('')
    } else {
      alert('Неверный формат данных')
    }
  }

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

  /** Начало редактирования правила */
  const handleEditRule = (attrId: number, rule: AttributeColorRule) => {
    setEditingAttrId(attrId)
    setEditingRuleId(rule.id)
    setSelectedAttrId(attrId)
    setMinVal(rule.min !== null ? String(rule.min) : '')
    setMaxVal(rule.max !== null ? String(rule.max) : '')
    setColor(rule.color)
  }

  /** Отмена редактирования */
  const handleCancelEdit = () => {
    setEditingAttrId(null)
    setEditingRuleId(null)
    setSelectedAttrId(undefined)
    setMinVal('')
    setMaxVal('')
    setColor('#ff0000')
  }

  /** Добавление нового правила */
  const handleAddRule = () => {
    if (selectedAttrId === undefined) return

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

  /** Сохранение отредактированного правила */
  const handleSaveRule = () => {
    if (editingAttrId === null || !editingRuleId) return

    const updatedRule: AttributeColorRule = {
      id: editingRuleId,
      min: minVal === '' ? null : Number(minVal),
      max: maxVal === '' ? null : Number(maxVal),
      color
    }

    const currentRules = settings.attributes[editingAttrId] || []
    updateSettings({
      ...settings,
      attributes: {
        ...settings.attributes,
        [editingAttrId]: currentRules.map(r => r.id === editingRuleId ? updatedRule : r)
      }
    })

    handleCancelEdit()
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
            onChange={(v) => setSelectedAttrId(v !== '' ? Number(v) : undefined)}
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
        {editingRuleId ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button onClick={handleSaveRule} size="sm">
              Сохранить
            </Button>
            <Button variant="ghost" onClick={handleCancelEdit} size="sm">
              Отмена
            </Button>
          </div>
        ) : (
          <Button onClick={handleAddRule} disabled={selectedAttrId === undefined} size="sm">
            Добавить правило
          </Button>
        )}
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
                  onClick={() => handleEditRule(attrId, rule)}
                  aria-label="Редактировать"
                >
                  ✎
                </Button>
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

      {/* Пресеты */}
      <div className={styles.presetsSection}>
        <h3 className={styles.sectionTitle}>Пресеты</h3>
        <div className={styles.presetForm}>
          <input
            type="text"
            className={styles.input}
            value={presetName}
            onChange={e => setPresetName(e.target.value)}
            placeholder="Название пресета"
            aria-label="Название пресета"
          />
          <Button onClick={handleSavePreset} disabled={!presetName.trim()} size="sm">
            Сохранить как пресет
          </Button>
        </div>
        {presets.length > 0 && (
          <div className={styles.presetList}>
            {presets.map(preset => (
              <div key={preset.id} className={styles.presetItem}>
                <span className={styles.presetName}>{preset.name}</span>
                <Button variant="ghost" size="sm" onClick={() => handleLoadPreset(preset)} aria-label={`Загрузить пресет ${preset.name}`}>
                  Загрузить
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeletePreset(preset.id)} aria-label={`Удалить пресет ${preset.name}`}>
                  ✕
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Экспорт / Импорт */}
      <div className={styles.exportImportSection}>
        <h3 className={styles.sectionTitle}>Экспорт / Импорт</h3>
        <div className={styles.exportImportButtons}>
          <Button onClick={handleExport} size="sm" disabled={flatRules.length === 0}>
            Копировать настройки
          </Button>
        </div>
        <div className={styles.importForm}>
          <input
            type="text"
            className={styles.input}
            value={importValue}
            onChange={e => setImportValue(e.target.value)}
            placeholder="Вставьте строку"
            aria-label="Импорт настроек"
          />
          <Button onClick={handleImport} size="sm" disabled={!importValue.trim()}>
            Импортировать
          </Button>
        </div>
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
