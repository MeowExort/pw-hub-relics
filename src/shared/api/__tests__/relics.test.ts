import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { RelicSearchParams } from '@/shared/types'

// Мокаем proxyRequest, чтобы перехватить параметры запроса
const mockProxyRequest = vi.fn().mockResolvedValue({ items: [], totalCount: 0 })
vi.mock('../proxy', () => ({
  proxyRequest: (...args: unknown[]) => mockProxyRequest(...args),
}))

import { searchRelics } from '../relics'

describe('searchRelics', () => {
  beforeEach(() => {
    mockProxyRequest.mockClear()
  })

  it('должен умножать minPrice и maxPrice на 100 при отправке запроса', async () => {
    const params: RelicSearchParams = {
      minPrice: 5,
      maxPrice: 10,
    }

    await searchRelics(params)

    const sentParams = mockProxyRequest.mock.calls[0][1]
    expect(sentParams.MinPrice).toBe(500)
    expect(sentParams.MaxPrice).toBe(1000)
  })

  it('должен передавать undefined для minPrice/maxPrice если они не заданы', async () => {
    const params: RelicSearchParams = {}

    await searchRelics(params)

    const sentParams = mockProxyRequest.mock.calls[0][1]
    expect(sentParams.MinPrice).toBeUndefined()
    expect(sentParams.MaxPrice).toBeUndefined()
  })

  it('должен корректно обрабатывать нулевую цену', async () => {
    const params: RelicSearchParams = {
      minPrice: 0,
      maxPrice: 0,
    }

    await searchRelics(params)

    const sentParams = mockProxyRequest.mock.calls[0][1]
    expect(sentParams.MinPrice).toBe(0)
    expect(sentParams.MaxPrice).toBe(0)
  })
})
