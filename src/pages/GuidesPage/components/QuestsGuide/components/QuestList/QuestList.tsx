import React, { useState, useMemo } from 'react';
import styles from './QuestList.module.scss';
import { QuestCard, Quest } from '../QuestCard/QuestCard';
import { Select } from '@/shared/ui';

const QUESTS: Quest[] = [
  {
    id: '1',
    name: 'Тайна древних реликвий',
    description: 'Серия квестов на исследование заброшенных храмов. Требуется победить стража.',
    rewards: ['Камень заточки (базовый)', 'Осколок реликвии'],
    profitability: 85,
    levelReq: 80,
  },
  {
    id: '2',
    name: 'Охота на призраков',
    description: 'Ежедневное задание на уничтожение 20 призраков в ночном лесу.',
    rewards: ['Золото', 'Опыт', 'Случайная реликвия (C-grade)'],
    profitability: 45,
    levelReq: 40,
  },
  {
    id: '3',
    name: 'Испытание мудреца',
    description: 'Интеллектуальная викторина и сбор редких трав на вершине горы.',
    rewards: ['Катализатор успеха', 'Свиток сохранения'],
    profitability: 95,
    levelReq: 100,
  },
  {
    id: '4',
    name: 'Забытый караван',
    description: 'Защита торгового каравана от разбойников в пустыне.',
    rewards: ['Золото', 'Сундук с реликвиями'],
    profitability: 60,
    levelReq: 60,
  },
];

/**
 * Список квестов с фильтрацией и сортировкой.
 */
export function QuestList() {
  const [sortBy, setSortBy] = useState<'profitability' | 'level'>('profitability');

  const sortedQuests = useMemo(() => {
    return [...QUESTS].sort((a, b) => {
      if (sortBy === 'profitability') return b.profitability - a.profitability;
      return a.levelReq - b.levelReq;
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
          <QuestCard key={quest.id} quest={quest} />
        ))}
      </div>
    </div>
  );
}
