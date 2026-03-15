/** Правило подсветки атрибута */
export interface AttributeColorRule {
  /** Уникальный ID правила (например, uuid или timestamp) */
  id: string
  /** Минимальное значение (включительно), null — нет нижней границы */
  min: number | null
  /** Максимальное значение (включительно), null — нет верхней границы */
  max: number | null
  /** Цвет в формате CSS (hex, rgb, переменная) */
  color: string
}

/** Настройки подсветки для всех атрибутов */
export interface AttributeColorSettings {
  /** Ключ — ID определения атрибута (attributeDefinitionId), значение — массив правил */
  attributes: Record<number, AttributeColorRule[]>
}

/** Сохранённый пресет настроек подсветки */
export interface AttributeColorPreset {
  /** Уникальный ID пресета */
  id: string
  /** Название пресета */
  name: string
  /** Настройки подсветки */
  settings: AttributeColorSettings
}
