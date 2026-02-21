import { useCallback, useMemo } from 'react'
import { useSearchParams as useRouterSearchParams } from 'react-router-dom'
import type { RelicSearchParams } from '@/shared/types'

const NUM_KEYS: (keyof RelicSearchParams)[] = [
  'soulType',
  'slotTypeId',
  'race',
  'soulLevel',
  'mainAttributeId',
  'minPrice',
  'maxPrice',
  'serverId',
  'minEnhancementLevel',
  'maxEnhancementLevel',
  'minAbsorbExperience',
  'maxAbsorbExperience',
  'sortAttributeId',
  'pageNumber',
  'pageSize',
]

const STR_KEYS: (keyof RelicSearchParams)[] = [
  'sortBy',
  'sortDirection',
]

/** Парсит число из строки или возвращает undefined */
function parseNum(v: string | null): number | undefined {
  if (!v) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

/** Парсит доп. атрибуты из строки вида "id:min:max;id:min:max" */
function parseAdditionalAttributes(v: string | null): any[] | undefined {
  if (!v) return undefined
  return v.split(';').map((item) => {
    const [id, min, max] = item.split(':')
    return {
      id: Number(id),
      minValue: min ? Number(min) : null,
      maxValue: max ? Number(max) : null,
    }
  }).filter(attr => !isNaN(attr.id))
}

/** Сериализует доп. атрибуты в строку */
function stringifyAdditionalAttributes(attrs: any[]): string {
  return attrs
    .map((a) => `${a.id}:${a.minValue ?? ''}:${a.maxValue ?? ''}`)
    .join(';')
}

/** Хук для синхронизации параметров поиска с URL */
export function useRelicSearchParams() {
  const [searchParams, setSearchParams] = useRouterSearchParams()

  const params: RelicSearchParams = useMemo(() => {
    const result: RelicSearchParams = {}
    for (const key of NUM_KEYS) {
      const val = parseNum(searchParams.get(key))
      if (val !== undefined) {
        ;(result as Record<string, any>)[key] = val
      }
    }

    for (const key of STR_KEYS) {
      const val = searchParams.get(key)
      if (val !== null) {
        ;(result as Record<string, any>)[key] = val
      }
    }

    const attrs = parseAdditionalAttributes(searchParams.get('additionalAttributes'))
    if (attrs) {
      result.additionalAttributes = attrs
    }

    // Дефолтная пагинация
    if (!result.pageNumber) result.pageNumber = 1
    if (!result.pageSize) result.pageSize = 20
    return result
  }, [searchParams])

  const setParams = useCallback(
    (patch: Partial<RelicSearchParams>) => {
      const next = new URLSearchParams(searchParams)
      for (const [key, value] of Object.entries(patch)) {
        if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
          next.delete(key)
        } else if (key === 'additionalAttributes') {
          next.set(key, stringifyAdditionalAttributes(value as any[]))
        } else {
          next.set(key, String(value))
        }
      }
      // Сброс на первую страницу при изменении фильтров
      if (!('pageNumber' in patch)) {
        next.set('pageNumber', '1')
      }
      setSearchParams(next)
    },
    [searchParams, setSearchParams],
  )

  const resetParams = useCallback(() => {
    setSearchParams(new URLSearchParams())
  }, [setSearchParams])

  return { params, setParams, resetParams }
}
