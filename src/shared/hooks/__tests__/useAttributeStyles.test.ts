import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAttributeStyles } from '../useAttributeStyles'
import { attributeStylesService } from '@/shared/lib/attributeStylesService'

describe('useAttributeStyles', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('должен возвращать пустые настройки при инициализации', () => {
    const { result } = renderHook(() => useAttributeStyles())
    expect(result.current.settings).toEqual({ attributes: {} })
  })

  it('должен возвращать цвет через getAttributeColor', () => {
    const mockSettings = {
      attributes: {
        1: [{ id: '1', min: 100, max: null, color: 'red' }]
      }
    }
    attributeStylesService.saveSettings(mockSettings)

    const { result } = renderHook(() => useAttributeStyles())
    
    expect(result.current.getAttributeColor(1, 150)).toBe('red')
    expect(result.current.getAttributeColor(1, 50)).toBeNull()
  })

  it('должен обновлять настройки и оповещать об изменениях', () => {
    const { result } = renderHook(() => useAttributeStyles())
    
    const newSettings = {
      attributes: {
        2: [{ id: '2', min: null, max: 10, color: 'blue' }]
      }
    }

    act(() => {
      result.current.updateSettings(newSettings)
    })

    expect(result.current.settings).toEqual(newSettings)
    expect(attributeStylesService.getSettings()).toEqual(newSettings)
  })

  it('должен синхронизировать настройки между экземплярами хука в одной вкладке', () => {
    const { result: hook1 } = renderHook(() => useAttributeStyles())
    const { result: hook2 } = renderHook(() => useAttributeStyles())

    const newSettings = {
      attributes: {
        5: [{ id: '5', min: 0, max: 100, color: 'purple' }]
      }
    }

    act(() => {
      hook1.current.updateSettings(newSettings)
    })

    // Второй экземпляр хука должен получить обновлённые настройки
    expect(hook2.current.settings).toEqual(newSettings)
  })

  it('должен реагировать на изменения в localStorage из других вкладок', () => {
    const { result } = renderHook(() => useAttributeStyles())
    
    const otherTabSettings = {
      attributes: {
        3: [{ id: '3', min: 5, max: 5, color: 'green' }]
      }
    }

    act(() => {
      localStorage.setItem('pwhub_attribute_styles', JSON.stringify(otherTabSettings))
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'pwhub_attribute_styles',
        newValue: JSON.stringify(otherTabSettings)
      }))
    })

    expect(result.current.settings).toEqual(otherTabSettings)
  })
})
