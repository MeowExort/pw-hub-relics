import React from 'react';
import type { PriceTrendsStatistics } from '@/shared/types';
import styles from './MarketStats.module.scss';

interface MarketStatsProps {
  /** Агрегированная статистика за весь период */
  statistics: PriceTrendsStatistics;
}

/**
 * Форматирует цену из серебра в золото.
 */
function formatPrice(silver: number): string {
  const gold = Math.floor(silver / 100);
  const rest = silver % 100;
  if (rest === 0) return `${gold} зол.`;
  return `${gold} зол. ${rest} сер.`;
}

/**
 * Блок статистики рынка.
 * Отображает агрегированные показатели: средняя цена, мин/макс, объём торгов, динамика.
 */
export function MarketStats({ statistics }: MarketStatsProps) {
  return (
    <div className={styles.stats}>
      <div className={styles.card}>
        <span className={styles.label}>Средняя цена</span>
        <span className={styles.value}>{formatPrice(statistics.overallAverage)}</span>
      </div>
      <div className={styles.card}>
        <span className={styles.label}>Мин. цена</span>
        <span className={`${styles.value} ${styles.success}`}>{formatPrice(statistics.overallMin)}</span>
      </div>
      <div className={styles.card}>
        <span className={styles.label}>Макс. цена</span>
        <span className={`${styles.value} ${styles.danger}`}>{formatPrice(statistics.overallMax)}</span>
      </div>
      <div className={styles.card}>
        <span className={styles.label}>Объём торгов</span>
        <span className={styles.value}>{statistics.totalListings.toLocaleString()}</span>
      </div>
      <div className={styles.card}>
        <span className={styles.label}>Динамика</span>
        <span className={`${styles.value} ${statistics.priceChange >= 0 ? styles.danger : styles.success}`}>
          {statistics.priceChange >= 0 ? '↑' : '↓'} {statistics.priceChangePercent.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
