import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { PriceTrendPoint } from '@/shared/types';
import styles from './PriceChart.module.scss';

interface PriceChartProps {
  /** Данные ценовых трендов */
  data: PriceTrendPoint[];
}

/**
 * Форматирует цену из серебра в золото.
 * @param silver — цена в серебре
 */
function formatPrice(silver: number): string {
  const gold = Math.floor(silver / 100);
  const rest = silver % 100;
  if (rest === 0) return `${gold} зол.`;
  return `${gold} зол. ${rest} сер.`;
}

/**
 * Форматирует дату для оси X.
 */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

/**
 * Кастомный тултип для графика.
 */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const date = new Date(label);
  const formatted = date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipDate}>{formatted}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} className={styles.tooltipItem} style={{ color: entry.color }}>
          {entry.name}: {formatPrice(entry.value)}
        </p>
      ))}
    </div>
  );
}

/**
 * График ценовых трендов.
 * Отображает среднюю, минимальную и максимальную цены.
 */
export function PriceChart({ data }: PriceChartProps) {
  if (!data.length) {
    return (
      <div className={styles.empty}>
        <p>Нет данных для отображения</p>
      </div>
    );
  }

  return (
    <div className={styles.chart}>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary, #5b7ff5)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--primary, #5b7ff5)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--warning, #f1c40f)" stopOpacity={0.2} />
              <stop offset="95%" stopColor="var(--warning, #f1c40f)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border, #2a2d35)" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatDate}
            stroke="var(--text-muted, #555a63)"
            fontSize={12}
          />
          <YAxis
            tickFormatter={(v) => `${Math.floor(v / 100)}`}
            stroke="var(--text-muted, #555a63)"
            fontSize={12}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            type="monotone"
            dataKey="averagePrice"
            name="Средняя цена"
            stroke="#5b7ff5"
            fill="url(#avgGradient)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="maxPrice"
            name="Макс. цена"
            stroke="#ff6b6b"
            fill="none"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
          <Area
            type="monotone"
            dataKey="minPrice"
            name="Мин. цена"
            stroke="#7ad97a"
            fill="none"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
