import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Recommendation } from '@/shared/types';
import styles from './RecommendationCard.module.scss';

interface RecommendationCardProps {
  recommendation: Recommendation;
}

/**
 * Карточка рекомендации реликвии для заточки.
 * По клику переходит на страницу реликвии.
 */
export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/relics/${recommendation.relicListingId}`);
  };

  return (
    <div className={styles.card} onClick={handleClick} role="button" tabIndex={0}>
      <div className={styles.header}>
        <span className={styles.name}>{recommendation.relicName}</span>
        <span className={styles.price}>{recommendation.price / 100} зол.</span>
      </div>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.label}>Опыт:</span>
          <span className={styles.value}>+{recommendation.absorbExperience.toLocaleString()}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.label}>Цена/Ед. опыта:</span>
          <span className={styles.value}>{recommendation.pricePerExperience.toFixed(2)}</span>
        </div>
      </div>
      <div className={styles.footer}>
        <span className={styles.cumulative}>
          Накопленный опыт: {recommendation.cumulativeExperience.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
