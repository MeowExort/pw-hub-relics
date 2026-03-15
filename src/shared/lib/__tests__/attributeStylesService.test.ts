import { describe, it, expect, beforeEach, vi } from 'vitest'
import { attributeStylesService } from '../attributeStylesService'

describe('attributeStylesService', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('должен возвращать пустые настройки по умолчанию', () => {
    const settings = attributeStylesService.getSettings()
    expect(settings).toEqual({ attributes: {} })
  })

  it('должен сохранять и загружать настройки', () => {
    const mockSettings = {
      attributes: {
        1: [{ id: 'rule-1', min: 100, max: 200, color: '#ff0000' }]
      }
    }
    attributeStylesService.saveSettings(mockSettings)
    expect(attributeStylesService.getSettings()).toEqual(mockSettings)
  })

  it('должен правильно определять цвет для значения в диапазоне', () => {
    const settings = {
      attributes: {
        1: [
          { id: '1', min: 150, max: null, color: 'red' },
          { id: '2', min: 100, max: 149, color: 'orange' }
        ]
      }
    }
    attributeStylesService.saveSettings(settings)

    // Выше 150
    expect(attributeStylesService.getColor(1, 160)).toBe('red')
    // Ровно 150 (граница включительно)
    expect(attributeStylesService.getColor(1, 150)).toBe('red')
    // В диапазоне 100-149
    expect(attributeStylesService.getColor(1, 120)).toBe('orange')
    // Нижняя граница 100
    expect(attributeStylesService.getColor(1, 100)).toBe('orange')
    // Вне диапазонов
    expect(attributeStylesService.getColor(1, 50)).toBeNull()
  })

  it('должен возвращать null если атрибут не настроен', () => {
    expect(attributeStylesService.getColor(999, 100)).toBeNull()
  })

  it('должен корректно обрабатывать только одну границу', () => {
    const settings = {
      attributes: {
        1: [{ id: '1', min: null, max: 50, color: 'gray' }]
      }
    }
    attributeStylesService.saveSettings(settings)
    expect(attributeStylesService.getColor(1, 40)).toBe('gray')
    expect(attributeStylesService.getColor(1, 50)).toBe('gray')
    expect(attributeStylesService.getColor(1, 60)).toBeNull()
  })
})
