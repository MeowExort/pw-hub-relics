import { useCallback, useMemo } from 'react'
import { useSearchParams as useRouterSearchParams } from 'react-router-dom'
import type { AttributeFilterDto } from '@/shared/types'
import type { PeriodId } from './components/AnalyticsFilters'

/** Параметры фильтрации аналитики */
export interface AnalyticsParams {
  serverId?: number
  period: PeriodId
  soulLevel?: number
  soulType?: number
  slotTypeId?: number
  race?: number
  groupBy?: 'hour' | 'day' | 'week'
  mainAttributeIds?: number[]
  additionalAttributes: AttributeFilterDto[]
  minPrice?: number
  maxPrice?: number
  minEnhancementLevel?: number
  maxEnhancementLevel?: number
  minAbsorbExperience?: number
  maxAbsorbExperience?: number
  minAdditionalAttributeCount?: number
  maxAdditionalAttributeCount?: number
}

/** Маппинг полных ключей в короткие для сжатия URL */
const KEY_TO_SHORT: Record<string, string> = {
  serverId: 's',
  period: 'pd',
  soulType: 't',
  race: 'r',
  soulLevel: 'l',
  slotTypeId: 'sl',
  groupBy: 'gb',
  mainAttributeIds: 'ma',
  minPrice: 'p0',
  maxPrice: 'p1',
  additionalAttributes: 'aa',
  minEnhancementLevel: 'e0',
  maxEnhancementLevel: 'e1',
  minAbsorbExperience: 'a0',
  maxAbsorbExperience: 'a1',
  minAdditionalAttributeCount: 'ac0',
  maxAdditionalAttributeCount: 'ac1',
}

const NUM_KEYS: (keyof AnalyticsParams)[] = [
  'serverId',
  'soulType',
  'slotTypeId',
  'race',
  'soulLevel',
  'minPrice',
  'maxPrice',
  'minEnhancementLevel',
  'maxEnhancementLevel',
  'minAbsorbExperience',
  'maxAbsorbExperience',
  'minAdditionalAttributeCount',
  'maxAdditionalAttributeCount',
]

/** Пустой массив доп. атрибутов (стабильная ссылка для мемоизации) */
const EMPTY_ATTRS: AttributeFilterDto[] = []

/** Дефолтные значения, которые не нужно записывать в URL */
const DEFAULTS: Record<string, any> = {
  period: '30d',
}

/** Парсит число из строки или возвращает undefined */
function parseNum(v: string | null): number | undefined {
  if (!v) return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

/** Парсит доп. атрибуты из строки вида "id:min;id:min" */
function parseAdditionalAttributes(v: string | null): AttributeFilterDto[] | undefined {
  if (!v) return undefined
  return v.split(';').map((item) => {
    const [id, min] = item.split(':')
    return {
      id: Number(id),
      minValue: min ? Number(min) : undefined,
    }
  }).filter(attr => !isNaN(attr.id))
}

/** Сериализует доп. атрибуты в строку */
function stringifyAdditionalAttributes(attrs: AttributeFilterDto[]): string {
  return attrs
    .map((a) => `${a.id}:${a.minValue ?? ''}`)
    .join(';')
}

/** Хук для синхронизации параметров аналитики с URL */
export function useAnalyticsSearchParams() {
  const [searchParams, setSearchParams] = useRouterSearchParams()

  const params: AnalyticsParams = useMemo(() => {
    const result: Record<string, any> = {}

    for (const key of NUM_KEYS) {
      const shortKey = KEY_TO_SHORT[key] || key
      const val = parseNum(searchParams.get(shortKey) ?? searchParams.get(key))
      if (val !== undefined) {
        result[key] = val
      }
    }

    // period
    const pdShort = KEY_TO_SHORT['period']
    const pdRaw = searchParams.get(pdShort) ?? searchParams.get('period')
    result.period = (pdRaw === '7d' || pdRaw === '30d') ? pdRaw : '30d'

    // groupBy
    const gbShort = KEY_TO_SHORT['groupBy']
    const gbRaw = searchParams.get(gbShort) ?? searchParams.get('groupBy')
    if (gbRaw === 'hour' || gbRaw === 'day' || gbRaw === 'week') {
      result.groupBy = gbRaw
    }

    // mainAttributeIds
    const maShort = KEY_TO_SHORT['mainAttributeIds']
    const maRaw = searchParams.get(maShort) ?? searchParams.get('mainAttributeIds')
    if (maRaw) {
      const ids = maRaw.split(',').map(Number).filter(n => !isNaN(n))
      if (ids.length > 0) result.mainAttributeIds = ids
    }

    // additionalAttributes
    const aaShort = KEY_TO_SHORT['additionalAttributes']
    const attrs = parseAdditionalAttributes(
      searchParams.get(aaShort) ?? searchParams.get('additionalAttributes'),
    )
    result.additionalAttributes = attrs ?? EMPTY_ATTRS

    return result as AnalyticsParams
  }, [searchParams])

  const setParams = useCallback(
    (patch: Partial<AnalyticsParams>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(patch)) {
          const shortKey = KEY_TO_SHORT[key] || key
          next.delete(key)
          next.delete(shortKey)

          if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
            continue
          }

          // Не записываем дефолтные значения
          if (key in DEFAULTS && value === DEFAULTS[key]) {
            continue
          }

          if (key === 'mainAttributeIds') {
            next.set(shortKey, (value as number[]).join(','))
          } else if (key === 'additionalAttributes') {
            next.set(shortKey, stringifyAdditionalAttributes(value as AttributeFilterDto[]))
          } else {
            next.set(shortKey, String(value))
          }
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
