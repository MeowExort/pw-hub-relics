import type { AttributeColorSettings } from '@/shared/types'

const STORAGE_KEY = 'pwhub_attribute_styles'

/**
 * Сервис для управления пользовательскими правилами подсветки атрибутов.
 */
export const attributeStylesService = {
  /** Получить текущие настройки из localStorage */
  getSettings(): AttributeColorSettings {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return { attributes: {} }
    try {
      return JSON.parse(saved)
    } catch (e) {
      console.error('Ошибка парсинга настроек подсветки', e)
      return { attributes: {} }
    }
  },

  /** Сохранить настройки в localStorage */
  saveSettings(settings: AttributeColorSettings): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  },

  /** 
   * Получить цвет для конкретного атрибута и его значения.
   * Возвращает null, если подходящее правило не найдено.
   */
  getColor(attributeId: number, value: number): string | null {
    const settings = this.getSettings()
    const rules = settings.attributes[attributeId]
    
    if (!rules || rules.length === 0) return null

    // Находим первое подходящее правило
    const rule = rules.find(r => {
      const minOk = r.min === null || value >= r.min
      const maxOk = r.max === null || value <= r.max
      return minOk && maxOk
    })

    return rule ? rule.color : null
  }
}
