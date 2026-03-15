import { useQuery } from '@tanstack/react-query';
import { getServers, getSlotTypes, getAttributes } from '@/shared/api/dictionaries';
import { Select, MultiSelect, PriceRangeInput } from '@/shared/ui';
import { AdditionalAttributesFilter } from '@/pages/SearchPage/components/SearchFilters/AdditionalAttributesFilter/AdditionalAttributesFilter';
import type { AttributeFilterDto } from '@/shared/types';
import styles from './AnalyticsFilters.module.scss';

/** Доступные периоды */
const PERIODS = [
  { id: '7d', label: '7д' },
  { id: '30d', label: '30д' }
] as const;

export type PeriodId = typeof PERIODS[number]['id'];

/** Маппинг типов души */
const SOUL_TYPES = [
  { value: 1, label: 'Душа Покоя' },
  { value: 2, label: 'Душа Тяньюя' },
];

/** Уровни души */
const SOUL_LEVELS = [
  { value: 1, label: '1 уровень' },
  { value: 2, label: '2 уровень' },
  { value: 3, label: '3 уровень' },
  { value: 4, label: '4 уровень' },
  { value: 5, label: '5 уровень' },
];

/** Маппинг рас */
const RACES = [
  { value: 1, label: 'Люди' },
  { value: 2, label: 'Зооморфы' },
  { value: 3, label: 'Сиды' },
  { value: 4, label: 'Амфибии' },
  { value: 5, label: 'Древние' },
  { value: 6, label: 'Тени' },
];

/** Варианты группировки */
const GROUP_BY_OPTIONS = [
  { value: 'hour', label: 'По часам' },
  { value: 'day', label: 'По дням' },
  { value: 'week', label: 'По неделям' },
];

interface AnalyticsFiltersProps {
  /** Выбранный сервер */
  serverId?: number;
  /** Обработчик смены сервера */
  onServerChange: (id?: number) => void;
  /** Выбранный период */
  period: PeriodId;
  /** Обработчик смены периода */
  onPeriodChange: (period: PeriodId) => void;
  /** Уровень души */
  soulLevel?: number;
  /** Обработчик смены уровня души */
  onSoulLevelChange: (level?: number) => void;
  /** Тип души */
  soulType?: number;
  /** Обработчик смены типа души */
  onSoulTypeChange: (type?: number) => void;
  /** ID типа слота */
  slotTypeId?: number;
  /** Обработчик смены типа слота */
  onSlotTypeIdChange: (id?: number) => void;
  /** Раса */
  race?: number;
  /** Обработчик смены расы */
  onRaceChange: (race?: number) => void;
  /** Группировка данных */
  groupBy?: 'hour' | 'day' | 'week';
  /** Обработчик смены группировки */
  onGroupByChange: (groupBy?: 'hour' | 'day' | 'week') => void;
  /** ID основных атрибутов */
  mainAttributeIds?: number[];
  /** Обработчик смены основных атрибутов */
  onMainAttributeIdsChange: (ids?: number[]) => void;
  /** Дополнительные атрибуты */
  additionalAttributes: AttributeFilterDto[];
  /** Обработчик смены дополнительных атрибутов */
  onAdditionalAttributesChange: (attrs: AttributeFilterDto[]) => void;
  /** Минимальная цена */
  minPrice?: number;
  /** Максимальная цена */
  maxPrice?: number;
  /** Обработчик смены диапазона цен */
  onMinPriceChange: (v?: number) => void;
  /** Обработчик смены максимальной цены */
  onMaxPriceChange: (v?: number) => void;
  /** Мин. уровень заточки */
  minEnhancementLevel?: number;
  /** Макс. уровень заточки */
  maxEnhancementLevel?: number;
  /** Обработчик смены мин. уровня заточки */
  onMinEnhancementLevelChange: (v?: number) => void;
  /** Обработчик смены макс. уровня заточки */
  onMaxEnhancementLevelChange: (v?: number) => void;
  /** Мин. опыт поглощения */
  minAbsorbExperience?: number;
  /** Макс. опыт поглощения */
  maxAbsorbExperience?: number;
  /** Обработчик смены мин. опыта поглощения */
  onMinAbsorbExperienceChange: (v?: number) => void;
  /** Обработчик смены макс. опыта поглощения */
  onMaxAbsorbExperienceChange: (v?: number) => void;
}

/**
 * Панель фильтров аналитики.
 * Содержит выбор сервера, уровня/типа души, типа слота, расы, группировки,
 * основного и дополнительных атрибутов, а также временного периода.
 */
export function AnalyticsFilters({
  serverId,
  onServerChange,
  period,
  onPeriodChange,
  soulLevel,
  onSoulLevelChange,
  soulType,
  onSoulTypeChange,
  slotTypeId,
  onSlotTypeIdChange,
  race,
  onRaceChange,
  groupBy,
  onGroupByChange,
  mainAttributeIds,
  onMainAttributeIdsChange,
  additionalAttributes,
  onAdditionalAttributesChange,
  minPrice,
  maxPrice,
  onMinPriceChange,
  onMaxPriceChange,
  minEnhancementLevel,
  maxEnhancementLevel,
  onMinEnhancementLevelChange,
  onMaxEnhancementLevelChange,
  minAbsorbExperience,
  maxAbsorbExperience,
  onMinAbsorbExperienceChange,
  onMaxAbsorbExperienceChange,
}: AnalyticsFiltersProps) {
  const { data: servers } = useQuery({
    queryKey: ['servers'],
    queryFn: () => getServers(),
  });

  const { data: slotTypes } = useQuery({
    queryKey: ['slotTypes'],
    queryFn: () => getSlotTypes(),
  });

  const { data: attributes } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => getAttributes(),
  });

  const serverOptions = [
    { value: '', label: 'Все серверы' },
    ...(servers?.map(s => ({ value: s.id.toString(), label: s.name })) || []),
  ];

  const slotTypeOptions = slotTypes?.map(s => ({ value: s.id, label: s.name })) || [];

  const mainAttrOptions = attributes?.map(a => ({ value: a.id, label: a.name })) || [];

  return (
    <div className={styles.filters}>
      <div className={styles.selects}>
        <div className={styles.field}>
          <Select
            label="Сервер"
            options={serverOptions}
            value={serverId?.toString() || ''}
            onChange={(val) => onServerChange(val ? Number(val) : undefined)}
          />
        </div>
        <div className={styles.field}>
          <Select
            label="Уровень души"
            options={SOUL_LEVELS}
            value={soulLevel}
            onChange={(val) => onSoulLevelChange(val ? Number(val) : undefined)}
          />
        </div>
        <div className={styles.field}>
          <Select
            label="Тип души"
            options={SOUL_TYPES}
            value={soulType}
            onChange={(val) => onSoulTypeChange(val ? Number(val) : undefined)}
          />
        </div>
        <div className={styles.field}>
          <Select
            label="Тип слота"
            options={slotTypeOptions}
            value={slotTypeId}
            onChange={(val) => onSlotTypeIdChange(val ? Number(val) : undefined)}
          />
        </div>
        <div className={styles.field}>
          <Select
            label="Раса"
            options={RACES}
            value={race}
            onChange={(val) => onRaceChange(val ? Number(val) : undefined)}
          />
        </div>
        <div className={styles.field}>
          <Select
            label="Группировка"
            options={GROUP_BY_OPTIONS}
            value={groupBy || ''}
            onChange={(val) => onGroupByChange(val ? val as 'hour' | 'day' | 'week' : undefined)}
          />
        </div>
        <div className={styles.field}>
          <MultiSelect
            label="Основной атрибут"
            options={mainAttrOptions}
            value={mainAttributeIds ?? []}
            onChange={(val) => onMainAttributeIdsChange(val.length > 0 ? val.map(Number) : undefined)}
          />
        </div>
        <div className={styles.field}>
          <AdditionalAttributesFilter
            attributes={attributes || []}
            value={additionalAttributes}
            onChange={onAdditionalAttributesChange}
          />
        </div>
        <div className={styles.field}>
          <PriceRangeInput
            label="Цена"
            min={minPrice?.toString() ?? ''}
            max={maxPrice?.toString() ?? ''}
            onMinChange={(v) => onMinPriceChange(v ? Number(v) : undefined)}
            onMaxChange={(v) => onMaxPriceChange(v ? Number(v) : undefined)}
          />
        </div>
        <div className={styles.field}>
          <PriceRangeInput
            label="Уровень заточки"
            min={minEnhancementLevel?.toString() ?? ''}
            max={maxEnhancementLevel?.toString() ?? ''}
            onMinChange={(v) => onMinEnhancementLevelChange(v ? Number(v) : undefined)}
            onMaxChange={(v) => onMaxEnhancementLevelChange(v ? Number(v) : undefined)}
          />
        </div>
        <div className={styles.field}>
          <PriceRangeInput
            label="Опыт поглощения"
            min={minAbsorbExperience?.toString() ?? ''}
            max={maxAbsorbExperience?.toString() ?? ''}
            onMinChange={(v) => onMinAbsorbExperienceChange(v ? Number(v) : undefined)}
            onMaxChange={(v) => onMaxAbsorbExperienceChange(v ? Number(v) : undefined)}
          />
        </div>
      </div>

      <div className={styles.periods}>
        <span className={styles.periodsLabel}>Период:</span>
        <div className={styles.periodButtons}>
          {PERIODS.map((p) => (
            <button
              key={p.id}
              className={`${styles.periodBtn} ${period === p.id ? styles.active : ''}`}
              onClick={() => onPeriodChange(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
