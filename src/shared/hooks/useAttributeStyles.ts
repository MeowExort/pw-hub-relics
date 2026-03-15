import { useState, useCallback, useEffect } from 'react'
import type { AttributeColorSettings } from '@/shared/types'
import { attributeStylesService } from '@/shared/lib/attributeStylesService'

/** Кастомное событие для синхронизации настроек подсветки между компонентами */
const SETTINGS_CHANGE_EVENT = 'pwhub_attribute_styles_change'

/**
 * Хук для работы с пользовательскими стилями атрибутов.
 * Позволяет получать и обновлять настройки подсветки.
 * Все экземпляры хука синхронизируются через кастомное событие.
 */
export function useAttributeStyles() {
  const [settings, setSettings] = useState<AttributeColorSettings>(() => attributeStylesService.getSettings())

  /** Обновить настройки (сохранить и обновить состояние) */
  const updateSettings = useCallback((newSettings: AttributeColorSettings) => {
    attributeStylesService.saveSettings(newSettings)
    setSettings(newSettings)
    // Оповещаем другие экземпляры хука в той же вкладке
    window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT))
  }, [])

  /** Получить цвет для атрибута по его ID и значению */
  const getAttributeColor = useCallback((attributeId: number, value: number): string | null => {
    const rules = settings.attributes[attributeId]
    if (!rules || rules.length === 0) return null

    const rule = rules.find(r => {
      const minOk = r.min === null || value >= r.min
      const maxOk = r.max === null || value <= r.max
      return minOk && maxOk
    })

    return rule ? rule.color : null
  }, [settings])

  // Синхронизация между экземплярами хука в одной вкладке
  useEffect(() => {
    const handleChange = () => {
      setSettings(attributeStylesService.getSettings())
    }
    window.addEventListener(SETTINGS_CHANGE_EVENT, handleChange)
    return () => window.removeEventListener(SETTINGS_CHANGE_EVENT, handleChange)
  }, [])

  // Синхронизация между вкладками
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'pwhub_attribute_styles') {
        setSettings(attributeStylesService.getSettings())
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return {
    settings,
    updateSettings,
    getAttributeColor
  }
}
