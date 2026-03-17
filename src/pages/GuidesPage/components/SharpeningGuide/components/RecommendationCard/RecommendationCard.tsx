import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Recommendation } from '@/shared/types';
import styles from './RecommendationCard.module.scss';

/**
 * Кнопка копирования названия реликвии в буфер обмена.
 * @param name — название реликвии для копирования
 */
function CopyNameButton({ name }: { name: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(name);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      className={styles.copyButton}
      onClick={handleCopy}
      aria-label="Скопировать название"
      title="Скопировать название"
      type="button"
    >
      {copied ? '✓' : '📋'}
    </button>
  );
}

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
        <span className={styles.name}>
          {recommendation.relicName}
          <CopyNameButton name={recommendation.relicName} />
        </span>
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
