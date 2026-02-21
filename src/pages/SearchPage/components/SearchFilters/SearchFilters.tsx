import { Select, PriceRangeInput, Button } from '@/shared/ui'
import { useDictionaries } from '@/shared/hooks'
import type { RelicSearchParams } from '@/shared/types'
import { AdditionalAttributesFilter } from './AdditionalAttributesFilter/AdditionalAttributesFilter'
import styles from './SearchFilters.module.scss'

/** Маппинг типов души */
const SOUL_TYPES = [
  { value: 1, label: 'Душа Покоя' },
  { value: 2, label: 'Душа Тяньюя' },
]

/** Маппинг рас */
const RACES = [
  { value: 1, label: 'Люди' },
  { value: 2, label: 'Зооморфы' },
  { value: 3, label: 'Сиды' },
  { value: 4, label: 'Амфибии' },
  { value: 5, label: 'Древние' },
  { value: 6, label: 'Тени' },
]

/** Уровни реликвий */
const SOUL_LEVELS = [
  { value: 1, label: '1 уровень' },
  { value: 2, label: '2 уровень' },
  { value: 3, label: '3 уровень' },
  { value: 4, label: '4 уровень' },
  { value: 5, label: '5 уровень' },
]

interface SearchFiltersProps {
  /** Текущие параметры фильтрации */
  params: RelicSearchParams
  /** Обработчик изменения параметров */
  onChange: (params: Partial<RelicSearchParams>) => void
  /** Сброс всех фильтров */
  onReset: () => void
}

/** Панель фильтрации реликвий */
export function SearchFilters({ params, onChange, onReset }: SearchFiltersProps) {
  const { servers, slotTypes, attributes } = useDictionaries()

  return (
    <div className={styles.filters} role="search" aria-label="Фильтры реликвий">
      <Select
        label="Сервер"
        options={servers.map((s) => ({ value: s.id, label: s.name }))}
        value={params.serverId}
        onChange={(v) => onChange({ serverId: v ? Number(v) : undefined })}
      />

      <Select
        label="Тип души"
        options={SOUL_TYPES}
        value={params.soulType}
        onChange={(v) => onChange({ soulType: v ? Number(v) : undefined })}
      />

      <Select
        label="Раса"
        options={RACES}
        value={params.race}
        onChange={(v) => onChange({ race: v ? Number(v) : undefined })}
      />

      <Select
        label="Уровень"
        options={SOUL_LEVELS}
        value={params.soulLevel}
        onChange={(v) => onChange({ soulLevel: v ? Number(v) : undefined })}
      />

      <Select
        label="Тип слота"
        options={slotTypes.map((s) => ({ value: s.id, label: s.name }))}
        value={params.slotTypeId}
        onChange={(v) => onChange({ slotTypeId: v ? Number(v) : undefined })}
      />

      <Select
        label="Основной атрибут"
        options={attributes.map((a) => ({ value: a.id, label: a.name }))}
        value={params.mainAttributeId}
        onChange={(v) => onChange({ mainAttributeId: v ? Number(v) : undefined })}
      />

      <AdditionalAttributesFilter
        attributes={attributes}
        value={params.additionalAttributes ?? []}
        onChange={(values) => onChange({ additionalAttributes: values })}
      />

      <PriceRangeInput
        label="Цена"
        min={params.minPrice?.toString() ?? ''}
        max={params.maxPrice?.toString() ?? ''}
        onMinChange={(v) => onChange({ minPrice: v ? Number(v) : undefined })}
        onMaxChange={(v) => onChange({ maxPrice: v ? Number(v) : undefined })}
      />

      <PriceRangeInput
        label="Уровень заточки"
        min={params.minEnhancementLevel?.toString() ?? ''}
        max={params.maxEnhancementLevel?.toString() ?? ''}
        onMinChange={(v) => onChange({ minEnhancementLevel: v ? Number(v) : undefined })}
        onMaxChange={(v) => onChange({ maxEnhancementLevel: v ? Number(v) : undefined })}
      />

      <PriceRangeInput
        label="Опыт поглощения"
        min={params.minAbsorbExperience?.toString() ?? ''}
        max={params.maxAbsorbExperience?.toString() ?? ''}
        onMinChange={(v) => onChange({ minAbsorbExperience: v ? Number(v) : undefined })}
        onMaxChange={(v) => onChange({ maxAbsorbExperience: v ? Number(v) : undefined })}
      />

      <div className={styles.actions}>
        <Button variant="ghost" size="sm" onClick={onReset}>
          Сбросить
        </Button>
      </div>
    </div>
  )
}
