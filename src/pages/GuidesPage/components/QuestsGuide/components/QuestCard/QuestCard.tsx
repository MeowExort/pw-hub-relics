import styles from './QuestCard.module.scss';
import { Badge, Tooltip } from '@/shared/ui';
import type { QuestRecommendation, PriceBreakdownEntry, RelicDefinitionPrice } from '@/shared/types';

/** Форматирует цену из серебра в читаемый вид */
function formatPrice(silver: number): string {
  const gold = Math.floor(silver / 100);
  const rest = silver % 100;
  if (gold === 0) return `${rest} сер.`;
  if (rest === 0) return `${gold} зол.`;
  return `${gold} зол. ${rest} сер.`;
}

interface RelicPriceTooltipProps {
  /** Цены по реликвиям */
  relics: RelicDefinitionPrice[];
}

/** Содержимое тултипа с ценами по реликвиям */
function RelicPriceTooltipContent({ relics }: RelicPriceTooltipProps) {
  if (relics.length === 0) return null;

  return (
    <div className={styles.raceTooltip}>
      <div className={styles.raceTooltipTitle}>Мин. цены по реликвиям:</div>
      {relics.map((relic) => (
        <div key={relic.id} className={styles.raceRow}>
          <span className={styles.raceName}>{relic.name}</span>
          <span className={styles.racePrice}>{formatPrice(relic.minPrice)}</span>
        </div>
      ))}
    </div>
  );
}

interface QuestCardProps {
  /** Рекомендация по квесту */
  recommendation: QuestRecommendation;
  /** Разбивка цен по уровням для данного типа души */
  priceBreakdown?: Record<string, PriceBreakdownEntry>;
  /** Выделить как лучший квест */
  highlighted?: boolean;
}

/**
 * Карточка рекомендации по квесту.
 * Отображает тип души, уровень, стоимость, награду и профит.
 */
export function QuestCard({ recommendation, priceBreakdown, highlighted }: QuestCardProps) {
  const getProfitVariant = (percent: number) => {
    if (percent >= 100) return 'success';
    if (percent >= 50) return 'warning';
    return 'primary';
  };

  // Получаем цены по реликвиям для стоимости квеста (уровень targetSoulLevel - 1)
  const questCostLevel = String(recommendation.targetSoulLevel - 1);
  const questCostBreakdown = priceBreakdown?.[questCostLevel];
  const questCostRelics = questCostBreakdown?.minPriceByRelicDefinition;

  // Получаем цены по реликвиям для ожидаемой награды (уровень targetSoulLevel)
  const rewardLevel = String(recommendation.targetSoulLevel);
  const rewardBreakdown = priceBreakdown?.[rewardLevel];
  const rewardRelics = rewardBreakdown?.minPriceByRelicDefinition;

  return (
    <div className={`${styles.card} ${highlighted ? styles.highlighted : ''}`}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          {highlighted && <span className={styles.crown}>👑</span>}
          <h3 className={styles.name}>
            {recommendation.soulTypeName} → ур. {recommendation.targetSoulLevel}
          </h3>
        </div>
        <Badge variant={getProfitVariant(recommendation.profitPercent)}>
          +{recommendation.profitPercent.toFixed(1)}%
        </Badge>
      </div>

      <div className={styles.details}>
        <div className={styles.detail}>
          <span className={styles.label}>Стоимость квеста:</span>
          <span className={styles.valueGroup}>
            {questCostRelics && questCostRelics.length > 0 ? (
              <Tooltip text={<RelicPriceTooltipContent relics={questCostRelics} />} position="top">
                <span className={styles.value + ' ' + styles.hoverable}>{recommendation.questCostFormatted}</span>
              </Tooltip>
            ) : (
              <span className={styles.value}>{recommendation.questCostFormatted}</span>
            )}
            {recommendation.listingsCountByQuestCost != null && (
              <span className={styles.listingsCount} title="Лотов по этой цене (±15%)">
                📦 {recommendation.listingsCountByQuestCost}
              </span>
            )}
          </span>
        </div>
        <div className={styles.detail}>
          <span className={styles.label}>Ожидаемая награда:</span>
          <span className={styles.valueGroup}>
            {rewardRelics && rewardRelics.length > 0 ? (
              <Tooltip text={<RelicPriceTooltipContent relics={rewardRelics} />} position="top">
                <span className={styles.valueReward + ' ' + styles.hoverable}>{recommendation.expectedRewardFormatted}</span>
              </Tooltip>
            ) : (
              <span className={styles.valueReward}>{recommendation.expectedRewardFormatted}</span>
            )}
            {recommendation.listingsCountByExpectedReward != null && (
              <span className={styles.listingsCount} title="Лотов по этой цене (±15%)">
                📦 {recommendation.listingsCountByExpectedReward}
              </span>
            )}
          </span>
        </div>
        <div className={styles.detail}>
          <span className={styles.label}>Чистая прибыль:</span>
          <span className={styles.valueProfit}>{recommendation.expectedProfitFormatted}</span>
        </div>
      </div>

      <div className={styles.rank}>
        <span className={styles.rankLabel}>Ранг</span>
        <span className={styles.rankValue}>#{recommendation.rank}</span>
      </div>
    </div>
  );
}
