import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMostProfitableQuest } from '@/shared/api/relics';
import { getServers } from '@/shared/api/dictionaries';
import { QuestCard } from './components/QuestCard/QuestCard';
import { Spinner, Select, Tooltip } from '@/shared/ui';
import styles from './QuestsGuide.module.scss';

/**
 * Гайд по квестам.
 * Модуль 4.2: отображает рекомендации по самым профитным квестам.
 */
const STORAGE_KEY = 'quests-guide-server';

function loadStoredServerId(): number | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    const val = Number(raw);
    return Number.isFinite(val) ? val : undefined;
  } catch {
    return undefined;
  }
}

export function QuestsGuide() {
  const [serverId, setServerId] = useState<number | undefined>(loadStoredServerId);

  useEffect(() => {
    try {
      if (serverId !== undefined) {
        localStorage.setItem(STORAGE_KEY, String(serverId));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // localStorage недоступен
    }
  }, [serverId]);

  const { data: servers } = useQuery({
    queryKey: ['servers'],
    queryFn: () => getServers(),
  });

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['mostProfitableQuest', serverId],
    queryFn: () => getMostProfitableQuest(serverId),
    enabled: serverId !== undefined,
    staleTime: 60000,
  });

  const serverOptions = servers?.map(s => ({ value: s.id.toString(), label: s.name })) || [];

  const bestRecommendation = result?.recommendations?.[0];
  const otherRecommendations = result?.recommendations?.slice(1) || [];

  return (
    <div className={styles.guide}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.titleGroup}>
            <h2 className={styles.title}>Квесты и награды</h2>
            <p className={styles.subtitle}>
              Найдите самые выгодные квесты для получения реликвий. Выберите сервер для анализа цен.
            </p>
          </div>
          <div className={styles.serverSelector}>
            <label className={styles.serverLabel}>Сервер:</label>
            <Select
              options={serverOptions}
              value={serverId?.toString() || ''}
              onChange={(val) => setServerId(val ? Number(val) : undefined)}
              className={styles.select}
              placeholder="Выберите сервер"
              showEmptyOption={false}
            />
          </div>
        </div>
      </header>

      {serverId === undefined ? (
        <div className={styles.placeholder}>
          <p>Выберите сервер для отображения рекомендаций</p>
        </div>
      ) : isLoading ? (
        <div className={styles.loader}>
          <Spinner />
          <p>Загрузка рекомендаций...</p>
        </div>
      ) : isError ? (
        <p className={styles.error}>Ошибка загрузки данных. Попробуйте позже.</p>
      ) : result ? (
        <>
          {result.calculatedAt && (
            <p className={styles.calculatedAt}>
              Рассчитано: {new Date(result.calculatedAt).toLocaleString('ru-RU')}
            </p>
          )}

          {bestRecommendation && (
            <section className={styles.bestQuestSection}>
              <h3 className={styles.sectionTitle}>🔥 Самый выгодный квест</h3>
              <QuestCard recommendation={bestRecommendation} highlighted />
            </section>
          )}

          {otherRecommendations.length > 0 && (
            <section className={styles.allQuestsSection}>
              <h3 className={styles.sectionTitle}>Другие рекомендации</h3>
              <div className={styles.grid}>
                {otherRecommendations.map((rec) => (
                  <QuestCard key={`${rec.soulType}-${rec.targetSoulLevel}`} recommendation={rec} />
                ))}
              </div>
            </section>
          )}

          {result.levelOneRecommendations && result.levelOneRecommendations.length > 0 && (
            <section className={styles.allQuestsSection}>
              <h3 className={styles.sectionTitle}>Рекомендации для 1 уровня души</h3>
              <div className={styles.grid}>
                {result.levelOneRecommendations.map((rec) => (
                  <div key={rec.soulType} className={styles.levelOneCard}>
                    <h4 className={styles.levelOneName}>{rec.soulTypeName}</h4>
                    <div className={styles.levelOneDetails}>
                      <div className={styles.levelOneDetail}>
                        <span className={styles.levelOneLabel}>Ожидаемая награда:</span>
                        <span className={styles.levelOneValueGroup}>
                          {rec.avgMinPriceByRace && Object.keys(rec.avgMinPriceByRace).length > 0 ? (
                            <Tooltip
                              text={
                                <div className={styles.raceTooltip}>
                                  <div className={styles.raceTooltipTitle}>Цена по расам:</div>
                                  {Object.entries(rec.avgMinPriceByRace).map(([race, price]) => (
                                    <div key={race} className={styles.raceRow}>
                                      <span className={styles.raceName}>{race}</span>
                                      <span className={styles.racePrice}>{price}</span>
                                    </div>
                                  ))}
                                </div>
                              }
                              position="top"
                            >
                              <span className={styles.levelOneValue + ' ' + styles.hoverable}>{rec.expectedRewardFormatted}</span>
                            </Tooltip>
                          ) : (
                            <span className={styles.levelOneValue}>{rec.expectedRewardFormatted}</span>
                          )}
                          {rec.listingsCountByExpectedReward != null && (
                            <span className={styles.listingsCount} title="Лотов по этой цене (±15%)">
                              📦 {rec.listingsCountByExpectedReward}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className={styles.levelOneDetail}>
                        <span className={styles.levelOneLabel}>Лотов на рынке:</span>
                        <span className={styles.levelOneValue}>{rec.listingsCount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      ) : null}
    </div>
  );
}
