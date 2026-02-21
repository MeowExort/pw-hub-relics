import { describe, it, expect, vi } from 'vitest'
import { buildQueryString, ApiError, get } from '../client'

// Мокаем глобальный fetch
global.fetch = vi.fn()

describe('buildQueryString', () => {
  it('возвращает пустую строку для пустого объекта', () => {
    expect(buildQueryString({})).toBe('')
  })

  it('пропускает undefined и null значения', () => {
    expect(buildQueryString({ a: undefined, b: null, c: 'ok' })).toBe('?c=ok')
  })

  it('сериализует числа и строки', () => {
    const result = buildQueryString({ page: 1, name: 'test' })
    expect(result).toBe('?page=1&name=test')
  })

  it('сериализует boolean', () => {
    expect(buildQueryString({ active: true })).toBe('?active=true')
  })

  it('сериализует массивы как повторяющиеся ключи', () => {
    const result = buildQueryString({ ids: [1, 2, 3] })
    expect(result).toBe('?ids=1&ids=2&ids=3')
  })
})

describe('ApiError', () => {
  it('содержит статус и сообщение', () => {
    const error = new ApiError(404, 'Не найдено')
    expect(error.status).toBe(404)
    expect(error.message).toBe('Не найдено')
    expect(error.name).toBe('ApiError')
    expect(error).toBeInstanceOf(Error)
  })
})

describe('API Key', () => {
  it('добавляет заголовок X-Api-Key во все запросы', async () => {
    // Настраиваем мок ответа fetch
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'ok' }),
    })

    await get('/test')

    // Проверяем вызов fetch
    const [url, init] = (global.fetch as any).mock.calls[0]
    expect(url).toBe('/test')
    expect(init.headers).toHaveProperty('X-Api-Key')
    expect(init.headers['X-Api-Key']).toBe('test_api_key_12345')
  })
})
