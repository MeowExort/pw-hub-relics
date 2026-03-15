import { describe, it, expect, beforeEach } from 'vitest'
import { presetService } from '../presetService'

describe('presetService', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('возвращает пустой массив пресетов по умолчанию', () => {
    expect(presetService.getPresets()).toEqual([])
  })

  it('сохраняет и возвращает пресет', () => {
    const settings = { attributes: { 1: [{ id: 'r1', min: 10, max: 50, color: '#ff0000' }] } }
    presetService.savePreset('Мой пресет', settings)

    const presets = presetService.getPresets()
    expect(presets).toHaveLength(1)
    expect(presets[0].name).toBe('Мой пресет')
    expect(presets[0].settings).toEqual(settings)
    expect(presets[0].id).toBeTruthy()
  })

  it('сохраняет несколько пресетов', () => {
    presetService.savePreset('Пресет 1', { attributes: {} })
    presetService.savePreset('Пресет 2', { attributes: {} })

    expect(presetService.getPresets()).toHaveLength(2)
  })

  it('удаляет пресет по ID', () => {
    presetService.savePreset('Пресет 1', { attributes: {} })
    presetService.savePreset('Пресет 2', { attributes: {} })

    const presets = presetService.getPresets()
    presetService.deletePreset(presets[0].id)

    const remaining = presetService.getPresets()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].name).toBe('Пресет 2')
  })

  it('возвращает пресет по ID', () => {
    presetService.savePreset('Тест', { attributes: { 1: [{ id: 'r1', min: null, max: null, color: '#000' }] } })
    const presets = presetService.getPresets()
    const found = presetService.getPresetById(presets[0].id)

    expect(found).toBeDefined()
    expect(found!.name).toBe('Тест')
  })

  it('возвращает undefined для несуществующего ID', () => {
    expect(presetService.getPresetById('nonexistent')).toBeUndefined()
  })

  it('экспортирует настройки в base64-строку', () => {
    const settings = { attributes: { 1: [{ id: 'r1', min: 10, max: 50, color: '#ff0000' }] } }
    const base64 = presetService.exportSettings(settings)
    const json = decodeURIComponent(atob(base64))
    const parsed = JSON.parse(json)

    expect(parsed.attributes).toEqual(settings.attributes)
  })

  it('импортирует настройки из валидной base64-строки', () => {
    const settings = { attributes: { 1: [{ id: 'r1', min: 10, max: 50, color: '#ff0000' }] } }
    const base64 = btoa(encodeURIComponent(JSON.stringify(settings)))
    const result = presetService.importSettings(base64)

    expect(result).toEqual(settings)
  })

  it('экспорт и импорт — обратимые операции', () => {
    const settings = { attributes: { 1: [{ id: 'r1', min: 10, max: 50, color: '#ff0000' }] } }
    const exported = presetService.exportSettings(settings)
    const imported = presetService.importSettings(exported)

    expect(imported).toEqual(settings)
  })

  it('возвращает null при импорте невалидной base64-строки', () => {
    expect(presetService.importSettings('!!!not-base64!!!')).toBeNull()
  })

  it('возвращает null при импорте base64 без поля attributes', () => {
    const base64 = btoa(encodeURIComponent(JSON.stringify({ foo: 'bar' })))
    expect(presetService.importSettings(base64)).toBeNull()
  })

  it('обрабатывает повреждённые данные в localStorage', () => {
    localStorage.setItem('pwhub_presets', 'broken')
    expect(presetService.getPresets()).toEqual([])
  })

  it('переименовывает пресет', () => {
    presetService.savePreset('Старое имя', { attributes: {} })
    const presets = presetService.getPresets()
    presetService.renamePreset(presets[0].id, 'Новое имя')

    const updated = presetService.getPresets()
    expect(updated[0].name).toBe('Новое имя')
  })
})
