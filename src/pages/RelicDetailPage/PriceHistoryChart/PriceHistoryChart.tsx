import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import clsx from 'clsx'
import { Spinner } from '@/shared/ui'
import { usePriceTrends } from '@/shared/hooks'
import type { RelicDetail, PriceTrendPoint } from '@/shared/types'
import styles from './PriceHistoryChart.module.scss'

/** Доступные периоды для графика */
const PERIODS = [
  { key: '7d', label: '7д', days: 7 },
  { key: '30d', label: '30д', days: 30 },
  { key: '90d', label: '90д', days: 90 },
] as const

type PeriodKey = (typeof PERIODS)[number]['key']

/** Пропсы компонента графика истории цен */
interface PriceHistoryChartProps {
  /** Данные реликвии для формирования запроса */
  relic: RelicDetail
}

/** Форматирование даты для оси X */
function formatXDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

/** Форматирование цены */
function formatPrice(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return String(value)
}

/** Кастомный тултип графика */
function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string }>
  label?: string
}) {
  if (!active || !payload?.length || !label) return null

  const point = payload[0]?.payload as PriceTrendPoint | undefined
  if (!point) return null

  const date = new Date(label).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipDate}>{date}</div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Средняя:</span>
        <span className={styles.tooltipValue}>{point.averagePrice.toLocaleString('ru-RU')}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Мин:</span>
        <span className={styles.tooltipValue}>{point.minPrice.toLocaleString('ru-RU')}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Макс:</span>
        <span className={styles.tooltipValue}>{point.maxPrice.toLocaleString('ru-RU')}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>Объём:</span>
        <span className={styles.tooltipValue}>{point.volume}</span>
      </div>
    </div>
  )
}

/** График истории цен по похожим реликвиям */
export function PriceHistoryChart({ relic }: PriceHistoryChartProps) {
  const [period, setPeriod] = useState<PeriodKey>('30d')

  const selectedPeriod = PERIODS.find((p) => p.key === period)!

  const params = useMemo(() => {
    const now = new Date()
    const start = new Date(now)
    start.setDate(start.getDate() - selectedPeriod.days)

    const def = relic.relicDefinition

    return {
      relicDefinitionId: def.id,
      soulType: def.soulType,
      soulLevel: def.soulLevel,
      serverId: relic.server.id,
      mainAttribute: {
        id: relic.mainAttribute.attributeDefinition.id,
      },
      additionalAttributes: relic.additionalAttributes.map((attr) => ({
        id: attr.attributeDefinition.id,
      })),
      startDate: start.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
      groupBy: selectedPeriod.days <= 7 ? 'day' : 'week',
    }
  }, [relic, selectedPeriod.days])

  const { data, isLoading } = usePriceTrends(params)

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.title}>История цен</span>
        <div className={styles.periodButtons}>
          {PERIODS.map((p) => (
            <button
              key={p.key}
              className={clsx(styles.periodBtn, period === p.key && styles.periodBtnActive)}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loading}>
          <Spinner size="md" />
        </div>
      ) : !data?.length ? (
        <div className={styles.empty}>Нет данных за выбранный период</div>
      ) : (
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5b7ff5" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#5b7ff5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d35" />
              <XAxis
                dataKey="date"
                tickFormatter={formatXDate}
                stroke="#555a63"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatPrice}
                stroke="#555a63"
                fontSize={11}
                tickLine={false}
                width={50}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="averagePrice"
                stroke="#5b7ff5"
                strokeWidth={2}
                fill="url(#priceGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
