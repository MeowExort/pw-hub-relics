import { useMemo } from 'react'
import type { RelicSearchParams } from '@/shared/types'
import { useDictionaries } from '@/shared/hooks'
import styles from './ActiveFilterChips.module.scss'

/** Маппинг типов души */
const SOUL_TYPE_LABELS: Record<number, string> = {
  1: 'Душа Покоя',
  2: 'Душа Тяньюя',
}

/** Маппинг рас */
const RACE_LABELS: Record<number, string> = {
  1: 'Люди',
  2: 'Зооморфы',
  3: 'Сиды',
  4: 'Амфибии',
  5: 'Древние',
  6: 'Тени',
}

/** Маппинг уровней */
const SOUL_LEVEL_LABELS: Record<number, string> = {
  1: '1 уровень',
  2: '2 уровень',
  3: '3 уровень',
  4: '4 уровень',
  5: '5 уровень',
}

/** Описание одного чипа фильтра */
interface FilterChip {
  /** Уникальный ключ чипа */
  key: string
  /** Название фильтра */
  label: string
  /** Значение фильтра */
  value: string
  /** Параметры для сброса этого фильтра */
  resetPatch: Partial<RelicSearchParams>
}

interface ActiveFilterChipsProps {
  /** Текущие параметры фильтрации */
  params: RelicSearchParams
  /** Обработчик изменения параметров */
  onChange: (params: Partial<RelicSearchParams>) => void
  /** Сброс всех фильтров */
  onReset: () => void
}

/** Чипы активных фильтров с возможностью удаления */
export function ActiveFilterChips({ params, onChange, onReset }: ActiveFilterChipsProps) {
  const { servers, slotTypes, attributes } = useDictionaries()

  const chips = useMemo<FilterChip[]>(() => {
    const result: FilterChip[] = []

    if (params.serverId) {
      const server = servers.find((s) => s.id === params.serverId)
      result.push({
        key: 'serverId',
        label: 'Сервер',
        value: server?.name ?? String(params.serverId),
        resetPatch: { serverId: undefined },
      })
    }

    if (params.soulType) {
      result.push({
        key: 'soulType',
        label: 'Тип души',
        value: SOUL_TYPE_LABELS[params.soulType] ?? String(params.soulType),
        resetPatch: { soulType: undefined },
      })
    }

    if (params.race) {
      result.push({
        key: 'race',
        label: 'Раса',
        value: RACE_LABELS[params.race] ?? String(params.race),
        resetPatch: { race: undefined },
      })
    }

    if (params.soulLevel) {
      result.push({
        key: 'soulLevel',
        label: 'Уровень',
        value: SOUL_LEVEL_LABELS[params.soulLevel] ?? String(params.soulLevel),
        resetPatch: { soulLevel: undefined },
      })
    }

    if (params.slotTypeId) {
      const slot = slotTypes.find((s) => s.id === params.slotTypeId)
      result.push({
        key: 'slotTypeId',
        label: 'Тип слота',
        value: slot?.name ?? String(params.slotTypeId),
        resetPatch: { slotTypeId: undefined },
      })
    }

    if (params.mainAttributeId) {
      const attr = attributes.find((a) => a.id === params.mainAttributeId)
      result.push({
        key: 'mainAttributeId',
        label: 'Осн. атрибут',
        value: attr?.name ?? String(params.mainAttributeId),
        resetPatch: { mainAttributeId: undefined },
      })
    }

    if (params.minPrice || params.maxPrice) {
      const parts: string[] = []
      if (params.minPrice) parts.push(`от ${params.minPrice.toLocaleString('ru-RU')}`)
      if (params.maxPrice) parts.push(`до ${params.maxPrice.toLocaleString('ru-RU')}`)
      result.push({
        key: 'price',
        label: 'Цена',
        value: parts.join(' '),
        resetPatch: { minPrice: undefined, maxPrice: undefined },
      })
    }

    if (params.minEnhancementLevel || params.maxEnhancementLevel) {
      const parts: string[] = []
      if (params.minEnhancementLevel) parts.push(`от +${params.minEnhancementLevel}`)
      if (params.maxEnhancementLevel) parts.push(`до +${params.maxEnhancementLevel}`)
      result.push({
        key: 'enhancement',
        label: 'Заточка',
        value: parts.join(' '),
        resetPatch: { minEnhancementLevel: undefined, maxEnhancementLevel: undefined },
      })
    }

    if (params.minAbsorbExperience || params.maxAbsorbExperience) {
      const parts: string[] = []
      if (params.minAbsorbExperience) parts.push(`от ${params.minAbsorbExperience.toLocaleString('ru-RU')}`)
      if (params.maxAbsorbExperience) parts.push(`до ${params.maxAbsorbExperience.toLocaleString('ru-RU')}`)
      result.push({
        key: 'absorbExp',
        label: 'Опыт поглощения',
        value: parts.join(' '),
        resetPatch: { minAbsorbExperience: undefined, maxAbsorbExperience: undefined },
      })
    }

    if (params.additionalAttributes && params.additionalAttributes.length > 0) {
      for (const aa of params.additionalAttributes) {
        const attr = attributes.find((a) => a.id === aa.id)
        const parts: string[] = []
        if (aa.minValue != null) parts.push(`от ${aa.minValue}`)
        if (aa.maxValue != null) parts.push(`до ${aa.maxValue}`)
        result.push({
          key: `addAttr-${aa.id}`,
          label: attr?.name ?? `Атрибут #${aa.id}`,
          value: parts.length > 0 ? parts.join(' ') : 'любое',
          resetPatch: {
            additionalAttributes: params.additionalAttributes!.filter((a) => a.id !== aa.id),
          },
        })
      }
    }

    return result
  }, [params, servers, slotTypes, attributes])

  if (chips.length === 0) return null

  return (
    <div className={styles.chips} data-testid="active-filter-chips">
      {chips.map((chip) => (
        <span key={chip.key} className={styles.chip} data-testid={`filter-chip-${chip.key}`}>
          <span className={styles.chipLabel}>{chip.label}:</span>
          <span className={styles.chipValue}>{chip.value}</span>
          <button
            type="button"
            className={styles.chipRemove}
            onClick={(e) => {
              e.preventDefault()
              onChange(chip.resetPatch)
            }}
            aria-label={`Убрать фильтр: ${chip.label}`}
          >
            ✕
          </button>
        </span>
      ))}
      <button
        type="button"
        className={styles.resetAll}
        onClick={(e) => {
          e.preventDefault()
          onReset()
        }}
      >
        Сбросить все
      </button>
    </div>
  )
}
