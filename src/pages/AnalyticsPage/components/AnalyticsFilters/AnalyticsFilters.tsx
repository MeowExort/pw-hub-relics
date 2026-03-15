import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getServers, getRelicDefinitions, getAttributes } from '@/shared/api/dictionaries';
import { Select } from '@/shared/ui';
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
  /** Выбранный тип реликвии */
  relicDefinitionId?: number;
  /** Обработчик смены типа реликвии */
  onRelicDefinitionChange: (id?: number) => void;
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
  /** Группировка данных */
  groupBy?: 'hour' | 'day' | 'week';
  /** Обработчик смены группировки */
  onGroupByChange: (groupBy?: 'hour' | 'day' | 'week') => void;
  /** Основной атрибут */
  mainAttribute?: AttributeFilterDto;
  /** Обработчик смены основного атрибута */
  onMainAttributeChange: (attr?: AttributeFilterDto) => void;
  /** Дополнительные атрибуты */
  additionalAttributes: AttributeFilterDto[];
  /** Обработчик смены дополнительных атрибутов */
  onAdditionalAttributesChange: (attrs: AttributeFilterDto[]) => void;
}

/**
 * Панель фильтров аналитики.
 * Содержит выбор сервера, типа реликвии, уровня/типа души, группировки,
 * основного и дополнительных атрибутов, а также временного периода.
 */
export function AnalyticsFilters({
  serverId,
  onServerChange,
  relicDefinitionId,
  onRelicDefinitionChange,
  period,
  onPeriodChange,
  soulLevel,
  onSoulLevelChange,
  soulType,
  onSoulTypeChange,
  groupBy,
  onGroupByChange,
  mainAttribute,
  onMainAttributeChange,
  additionalAttributes,
  onAdditionalAttributesChange,
}: AnalyticsFiltersProps) {
  const { data: servers } = useQuery({
    queryKey: ['servers'],
    queryFn: () => getServers(),
  });

  const { data: relicDefs } = useQuery({
    queryKey: ['relicDefinitions'],
    queryFn: () => getRelicDefinitions(),
  });

  const { data: attributes } = useQuery({
    queryKey: ['attributes'],
    queryFn: () => getAttributes(),
  });

  const serverOptions = [
    { value: '', label: 'Все серверы' },
    ...(servers?.map(s => ({ value: s.id.toString(), label: s.name })) || []),
  ];

  const relicOptions = [
    { value: '', label: 'Все реликвии' },
    ...(relicDefs?.map(r => ({ value: r.id.toString(), label: r.name })) || []),
  ];

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
            label="Тип реликвии"
            options={relicOptions}
            value={relicDefinitionId?.toString() || ''}
            onChange={(val) => onRelicDefinitionChange(val ? Number(val) : undefined)}
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
            label="Группировка"
            options={GROUP_BY_OPTIONS}
            value={groupBy || ''}
            onChange={(val) => onGroupByChange(val ? val as 'hour' | 'day' | 'week' : undefined)}
          />
        </div>
        <div className={styles.field}>
          <Select
            label="Основной атрибут"
            options={mainAttrOptions}
            value={mainAttribute?.id}
            onChange={(val) => onMainAttributeChange(val ? { id: Number(val), minValue: null, maxValue: null } : undefined)}
          />
        </div>
        <div className={styles.field}>
          <AdditionalAttributesFilter
            attributes={attributes || []}
            value={additionalAttributes}
            onChange={onAdditionalAttributesChange}
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
