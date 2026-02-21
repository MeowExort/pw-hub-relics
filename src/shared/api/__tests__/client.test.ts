import { describe, it, expect } from 'vitest'
import { buildQueryString, ApiError } from '../client'

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
