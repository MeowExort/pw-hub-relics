import type { AttributeColorSettings, AttributeColorPreset } from '@/shared/types'

const PRESETS_KEY = 'pwhub_presets'

/**
 * Сервис для управления пресетами настроек подсветки атрибутов.
 * Хранит пресеты в localStorage, поддерживает экспорт/импорт.
 */
export const presetService = {
  /** Получить все сохранённые пресеты */
  getPresets(): AttributeColorPreset[] {
    const saved = localStorage.getItem(PRESETS_KEY)
    if (!saved) return []
    try {
      return JSON.parse(saved)
    } catch {
      console.error('Ошибка парсинга пресетов')
      return []
    }
  },

  /** Сохранить текущие настройки как новый пресет */
  savePreset(name: string, settings: AttributeColorSettings): AttributeColorPreset {
    const preset: AttributeColorPreset = {
      id: crypto.randomUUID(),
      name,
      settings
    }
    const presets = this.getPresets()
    presets.push(preset)
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets))
    return preset
  },

  /** Удалить пресет по ID */
  deletePreset(id: string): void {
    const presets = this.getPresets().filter(p => p.id !== id)
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets))
  },

  /** Получить пресет по ID */
  getPresetById(id: string): AttributeColorPreset | undefined {
    return this.getPresets().find(p => p.id === id)
  },

  /** Переименовать пресет */
  renamePreset(id: string, newName: string): void {
    const presets = this.getPresets().map(p => p.id === id ? { ...p, name: newName } : p)
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets))
  },

  /** Экспортировать настройки в base64-строку */
  exportSettings(settings: AttributeColorSettings): string {
    const json = JSON.stringify(settings)
    return btoa(encodeURIComponent(json))
  },

  /** Импортировать настройки из base64-строки. Возвращает null при ошибке. */
  importSettings(base64: string): AttributeColorSettings | null {
    try {
      const json = decodeURIComponent(atob(base64.trim()))
      const parsed = JSON.parse(json)
      if (!parsed || typeof parsed.attributes !== 'object') return null
      return parsed as AttributeColorSettings
    } catch {
      return null
    }
  }
}
