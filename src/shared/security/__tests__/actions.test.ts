import { describe, it, expect } from 'vitest'
import { getActionId, ACTION_ROUTES } from '../actions'
import type { ApiAction } from '../actions'

describe('actions', () => {
  describe('getActionId', () => {
    it('возвращает обфусцированный идентификатор для searchRelics', () => {
      const id = getActionId('searchRelics')
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('возвращает разные идентификаторы для разных действий', () => {
      const id1 = getActionId('searchRelics')
      const id2 = getActionId('getRelicById')
      expect(id1).not.toBe(id2)
    })

    it('возвращает одинаковый идентификатор при повторном вызове', () => {
      const id1 = getActionId('getServers')
      const id2 = getActionId('getServers')
      expect(id1).toBe(id2)
    })

    it('бросает ошибку для неизвестного действия', () => {
      expect(() => getActionId('unknownAction' as ApiAction)).toThrow('Неизвестное действие API')
    })

    const allActions: ApiAction[] = [
      'searchRelics', 'getRelicById', 'getServers', 'getSlotTypes',
      'getAttributes', 'getRelicDefinitions', 'getEnhancementCurve',
      'getNotificationFilters', 'createNotificationFilter',
      'deleteNotificationFilter', 'generateTelegramLink',
    ]

    it('все действия имеют непустые идентификаторы', () => {
      for (const action of allActions) {
        const id = getActionId(action)
        expect(id).toBeTruthy()
      }
    })
  })

  describe('ACTION_ROUTES', () => {
    it('содержит маршруты для всех действий', () => {
      const actions: ApiAction[] = [
        'searchRelics', 'getRelicById', 'getServers', 'getSlotTypes',
        'getAttributes', 'getRelicDefinitions', 'getEnhancementCurve',
        'getNotificationFilters', 'createNotificationFilter',
        'deleteNotificationFilter', 'generateTelegramLink',
      ]

      for (const action of actions) {
        expect(ACTION_ROUTES[action]).toBeDefined()
        expect(ACTION_ROUTES[action].method).toBeTruthy()
        expect(ACTION_ROUTES[action].path).toBeTruthy()
      }
    })
  })
})
