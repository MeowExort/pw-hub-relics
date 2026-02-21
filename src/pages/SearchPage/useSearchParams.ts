import { useCallback, useMemo } from 'react'
import { useSearchParams as useRouterSearchParams } from 'react-router-dom'
import type { RelicSearchParams } from '@/shared/types'

/** Маппинг полных ключей в короткие для сжатия URL */
const KEY_TO_SHORT: Record<string, string> = {
  serverId: 's',
  soulType: 't',
  race: 'r',
  soulLevel: 'l',
  slotTypeId: 'sl',
  mainAttributeId: 'ma',
  minPrice: 'p0',
  maxPrice: 'p1',
  additionalAttributes: 'aa',
  sortBy: 'sb',
  sortDirection: 'sd',
  sortAttributeId: 'sa',
  pageNumber: 'pn',
  pageSize: 'ps',
  minEnhancementLevel: 'e0',
  maxEnhancementLevel: 'e1',
  minAbsorbExperience: 'a0',
  maxAbsorbExperience: 'a1',
}


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

/** Дефолтные значения, которые не нужно записывать в URL */
const DEFAULTS: Record<string, any> = {
  pageNumber: 1,
  pageSize: 20,
  sortDirection: 'desc',
}

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
      const shortKey = KEY_TO_SHORT[key] || key
      // Поддержка как коротких, так и полных ключей для обратной совместимости
      const val = parseNum(searchParams.get(shortKey) ?? searchParams.get(key))
      if (val !== undefined) {
        ;(result as Record<string, any>)[key] = val
      }
    }

    for (const key of STR_KEYS) {
      const shortKey = KEY_TO_SHORT[key] || key
      const val = searchParams.get(shortKey) ?? searchParams.get(key)
      if (val !== null) {
        ;(result as Record<string, any>)[key] = val
      }
    }

    const aaShort = KEY_TO_SHORT['additionalAttributes'] || 'additionalAttributes'
    const attrs = parseAdditionalAttributes(
      searchParams.get(aaShort) ?? searchParams.get('additionalAttributes'),
    )
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
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(patch)) {
          const shortKey = KEY_TO_SHORT[key] || key
          // Удаляем старые полные ключи для обратной совместимости
          next.delete(key)
          next.delete(shortKey)

          if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
            continue
          }

          // Не записываем дефолтные значения
          if (key in DEFAULTS && value === DEFAULTS[key]) {
            continue
          }

          if (key === 'additionalAttributes') {
            next.set(shortKey, stringifyAdditionalAttributes(value as any[]))
          } else {
            next.set(shortKey, String(value))
          }
        }
        // Сброс на первую страницу при изменении фильтров (не записываем pn=1, т.к. это дефолт)
        if (!('pageNumber' in patch)) {
          next.delete('pn')
          next.delete('pageNumber')
        }
        return next
      })
    },
    [setSearchParams],
  )

  const resetParams = useCallback(() => {
    setSearchParams(new URLSearchParams())
  }, [setSearchParams])

  return { params, setParams, resetParams }
}
