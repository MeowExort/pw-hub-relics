import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPriceTrends } from '@/shared/api/relics';
import { Spinner } from '@/shared/ui';
import { AnalyticsFilters, type PeriodId } from './components/AnalyticsFilters';
import { PriceChart } from './components/PriceChart';
import { MarketStats } from './components/MarketStats';
import type { AttributeFilterDto } from '@/shared/types';
import styles from './AnalyticsPage.module.scss';

/**
 * Страница аналитики цен.
 * Модуль 3: Дашборд трендов, графики, фильтры.
 */
export function AnalyticsPage() {
  const [serverId, setServerId] = useState<number | undefined>(undefined);
  const [relicDefinitionId, setRelicDefinitionId] = useState<number | undefined>(undefined);
  const [period, setPeriod] = useState<PeriodId>('30d');
  const [soulLevel, setSoulLevel] = useState<number | undefined>(undefined);
  const [soulType, setSoulType] = useState<number | undefined>(undefined);
  const [groupBy, setGroupBy] = useState<'hour' | 'day' | 'week' | undefined>(undefined);
  const [mainAttribute, setMainAttribute] = useState<AttributeFilterDto | undefined>(undefined);
  const [additionalAttributes, setAdditionalAttributes] = useState<AttributeFilterDto[]>([]);

  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    const map: Record<PeriodId, number> = {
      '7d': 7,
      '30d': 30
    };
    start.setDate(start.getDate() - map[period]);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [period]);

  const { data: response, isLoading, isError } = useQuery({
    queryKey: ['priceTrends', serverId, relicDefinitionId, period, soulLevel, soulType, groupBy, mainAttribute, additionalAttributes],
    queryFn: () => getPriceTrends({
      startDate,
      endDate,
      serverId,
      relicDefinitionId,
      soulLevel,
      soulType,
      groupBy,
      mainAttribute,
      additionalAttributes: additionalAttributes.length > 0 ? additionalAttributes : undefined,
    }),
    enabled: serverId !== undefined,
    staleTime: 60000,
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Аналитика цен</h1>
        <p className={styles.description}>
          Тренды и динамика цен на реликвии. Выберите сервер для начала анализа.
        </p>
      </header>

      <div className={styles.content}>
        <AnalyticsFilters
          serverId={serverId}
          onServerChange={setServerId}
          relicDefinitionId={relicDefinitionId}
          onRelicDefinitionChange={setRelicDefinitionId}
          period={period}
          onPeriodChange={setPeriod}
          soulLevel={soulLevel}
          onSoulLevelChange={setSoulLevel}
          soulType={soulType}
          onSoulTypeChange={setSoulType}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          mainAttribute={mainAttribute}
          onMainAttributeChange={setMainAttribute}
          additionalAttributes={additionalAttributes}
          onAdditionalAttributesChange={setAdditionalAttributes}
        />

        {serverId === undefined ? (
          <div className={styles.placeholder}>
            <p>Выберите сервер для отображения аналитики</p>
          </div>
        ) : isLoading ? (
          <div className={styles.loader}>
            <Spinner />
            <p>Загрузка данных...</p>
          </div>
        ) : isError ? (
          <p className={styles.error}>Ошибка загрузки данных. Попробуйте позже.</p>
        ) : response && response.dataPoints.length > 0 ? (
          <>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>Обзор рынка</h2>
              <MarketStats statistics={response.statistics} />
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>График цен</h2>
              <PriceChart data={response.dataPoints} />
            </section>
          </>
        ) : (
          <div className={styles.placeholder}>
            <p>Нет данных за выбранный период</p>
          </div>
        )}
      </div>
    </div>
  );
}
