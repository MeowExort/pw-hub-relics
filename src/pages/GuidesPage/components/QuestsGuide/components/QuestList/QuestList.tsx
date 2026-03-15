import { useState, useMemo } from 'react';
import styles from './QuestList.module.scss';
import { QuestCard } from '../QuestCard/QuestCard';
import type { QuestRecommendation } from '@/shared/types';
import { Select } from '@/shared/ui';

const QUESTS: QuestRecommendation[] = [];

/**
 * Список квестов с фильтрацией и сортировкой.
 */
export function QuestList() {
  const [sortBy, setSortBy] = useState<'profitability' | 'level'>('profitability');

  const sortedQuests = useMemo(() => {
    return [...QUESTS].sort((a, b) => {
      if (sortBy === 'profitability') return b.profitPercent - a.profitPercent;
      return a.targetSoulLevel - b.targetSoulLevel;
    });
  }, [sortBy]);

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <div className={styles.sortField}>
          <label>Сортировать по:</label>
          <Select
            options={[
              { value: 'profitability', label: 'Профитности' },
              { value: 'level', label: 'Уровню' },
            ]}
            value={sortBy}
            onChange={(val) => setSortBy(val as any)}
          />
        </div>
      </div>

      <div className={styles.grid}>
        {sortedQuests.map((quest) => (
          <QuestCard key={quest.rank} recommendation={quest} />
        ))}
      </div>
    </div>
  );
}
