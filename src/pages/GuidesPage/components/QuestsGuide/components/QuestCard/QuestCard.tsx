import styles from './QuestCard.module.scss';
import { Badge, Tooltip } from '@/shared/ui';
import type { QuestRecommendation } from '@/shared/types';

/** Маппинг английских названий рас на русские */
const RACE_NAMES: Record<string, string> = {
  human: 'Люди',
  untamed: 'Зооморфы',
  winged: 'Сиды',
  tideborn: 'Амфибии',
  earthguard: 'Древние',
  nightshade: 'Тени',
};

/** Форматирует цену из серебра в читаемый вид */
function formatPrice(silver: number): string {
  const gold = Math.floor(silver / 100);
  const rest = silver % 100;
  if (gold === 0) return `${rest} сер.`;
  if (rest === 0) return `${gold} зол.`;
  return `${gold} зол. ${rest} сер.`;
}

interface RacePriceTooltipProps {
  /** Цены по расам */
  priceByRace: Record<string, number>;
}

/** Содержимое тултипа с ценами по расам */
function RacePriceTooltipContent({ priceByRace }: RacePriceTooltipProps) {
  const entries = Object.entries(priceByRace);
  if (entries.length === 0) return null;

  return (
    <div className={styles.raceTooltip}>
      <div className={styles.raceTooltipTitle}>Цена по расам:</div>
      {entries.map(([race, price]) => (
        <div key={race} className={styles.raceRow}>
          <span className={styles.raceName}>{RACE_NAMES[race] || race}</span>
          <span className={styles.racePrice}>{formatPrice(price)}</span>
        </div>
      ))}
    </div>
  );
}

interface QuestCardProps {
  /** Рекомендация по квесту */
  recommendation: QuestRecommendation;
  /** Выделить как лучший квест */
  highlighted?: boolean;
}

/**
 * Карточка рекомендации по квесту.
 * Отображает тип души, уровень, стоимость, награду и профит.
 */
export function QuestCard({ recommendation, highlighted }: QuestCardProps) {
  const getProfitVariant = (percent: number) => {
    if (percent >= 100) return 'success';
    if (percent >= 50) return 'warning';
    return 'primary';
  };

  // Получаем цены по расам для стоимости квеста (уровень targetSoulLevel - 1)
  const questCostLevel = String(recommendation.targetSoulLevel - 1);
  const questCostBreakdown = recommendation.priceBreakdown?.[questCostLevel];
  const questCostByRace = questCostBreakdown?.minPriceByRace;

  // Получаем цены по расам для ожидаемой награды (уровень targetSoulLevel)
  const rewardLevel = String(recommendation.targetSoulLevel);
  const rewardBreakdown = recommendation.priceBreakdown?.[rewardLevel];
  const rewardByRace = rewardBreakdown?.minPriceByRace;

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
            {questCostByRace ? (
              <Tooltip text={<RacePriceTooltipContent priceByRace={questCostByRace} />} position="top">
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
            {rewardByRace ? (
              <Tooltip text={<RacePriceTooltipContent priceByRace={rewardByRace} />} position="top">
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
