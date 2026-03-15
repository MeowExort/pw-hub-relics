import React, { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPriceTrends } from '@/shared/api/relics';
import { Spinner, Select } from '@/shared/ui';
import { useNotificationFilters } from '@/shared/hooks';
import { isAuthenticated } from '@/shared/api/auth';
import type { NotificationFilter } from '@/shared/types';
import { AnalyticsFilters, type PeriodId } from './components/AnalyticsFilters';
import { PriceChart } from './components/PriceChart';
import { MarketStats } from './components/MarketStats';
import { useAnalyticsSearchParams } from './useAnalyticsSearchParams';
import styles from './AnalyticsPage.module.scss';

/**
 * Страница аналитики цен.
 * Модуль 3: Дашборд трендов, графики, фильтры.
 */
export function AnalyticsPage() {
  const { params, setParams } = useAnalyticsSearchParams();
  const authenticated = isAuthenticated();
  const { filters: subscriptions } = useNotificationFilters();

  /** Применить фильтр из подписки */
  const handleApplySubscription = useCallback((filter: NotificationFilter) => {
    const c = filter.criteria;
    setParams({
      serverId: c.serverId ?? undefined,
      soulType: c.soulType ?? undefined,
      race: c.race ?? undefined,
      soulLevel: c.soulLevel ?? undefined,
      slotTypeId: c.slotTypeId ?? undefined,
      mainAttributeIds: c.mainAttributeIds ?? undefined,
      additionalAttributes: c.additionalAttributes ?? [],
      minPrice: c.minPrice ?? undefined,
      maxPrice: c.maxPrice ?? undefined,
      minEnhancementLevel: c.minEnhancementLevel ?? undefined,
      maxEnhancementLevel: c.maxEnhancementLevel ?? undefined,
      minAbsorbExperience: c.minAbsorbExperience ?? undefined,
      maxAbsorbExperience: c.maxAbsorbExperience ?? undefined,
    });
  }, [setParams]);

  const { startDate, endDate } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    const map: Record<PeriodId, number> = {
      '7d': 7,
      '30d': 30
    };
    start.setDate(start.getDate() - map[params.period]);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  }, [params.period]);

  const { data: response, isLoading, isError } = useQuery({
    queryKey: [
      'priceTrends', params.serverId, params.period, params.soulLevel, params.soulType,
      params.slotTypeId, params.race, params.groupBy, params.mainAttributeIds,
      params.additionalAttributes, params.minPrice, params.maxPrice,
      params.minEnhancementLevel, params.maxEnhancementLevel,
      params.minAbsorbExperience, params.maxAbsorbExperience,
    ],
    queryFn: () => getPriceTrends({
      startDate,
      endDate,
      serverId: params.serverId,
      soulLevel: params.soulLevel,
      soulType: params.soulType,
      slotTypeId: params.slotTypeId,
      race: params.race,
      groupBy: params.groupBy,
      mainAttributeIds: params.mainAttributeIds,
      additionalAttributes: params.additionalAttributes.length > 0 ? params.additionalAttributes : undefined,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      minEnhancementLevel: params.minEnhancementLevel,
      maxEnhancementLevel: params.maxEnhancementLevel,
      minAbsorbExperience: params.minAbsorbExperience,
      maxAbsorbExperience: params.maxAbsorbExperience,
    }),
    enabled: params.serverId !== undefined,
    staleTime: 60000,
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.title}>Аналитика цен</h1>
          {authenticated && subscriptions.length > 0 && (
            <Select
              placeholder="Применить из подписки"
              options={subscriptions.map((s) => ({ value: s.id, label: s.name }))}
              value=""
              onChange={(v) => {
                const sub = subscriptions.find((s) => s.id === v)
                if (sub) handleApplySubscription(sub)
              }}
              className={styles.subscriptionSelect}
            />
          )}
        </div>
        <p className={styles.description}>
          Тренды и динамика цен на реликвии. Выберите сервер для начала анализа.
        </p>
      </header>

      <div className={styles.content}>
        <AnalyticsFilters
          serverId={params.serverId}
          onServerChange={(v) => setParams({ serverId: v })}
          period={params.period}
          onPeriodChange={(v) => setParams({ period: v })}
          soulLevel={params.soulLevel}
          onSoulLevelChange={(v) => setParams({ soulLevel: v })}
          soulType={params.soulType}
          onSoulTypeChange={(v) => setParams({ soulType: v })}
          slotTypeId={params.slotTypeId}
          onSlotTypeIdChange={(v) => setParams({ slotTypeId: v })}
          race={params.race}
          onRaceChange={(v) => setParams({ race: v })}
          groupBy={params.groupBy}
          onGroupByChange={(v) => setParams({ groupBy: v })}
          mainAttributeIds={params.mainAttributeIds}
          onMainAttributeIdsChange={(v) => setParams({ mainAttributeIds: v })}
          additionalAttributes={params.additionalAttributes}
          onAdditionalAttributesChange={(v) => setParams({ additionalAttributes: v })}
          minPrice={params.minPrice}
          maxPrice={params.maxPrice}
          onMinPriceChange={(v) => setParams({ minPrice: v })}
          onMaxPriceChange={(v) => setParams({ maxPrice: v })}
          minEnhancementLevel={params.minEnhancementLevel}
          maxEnhancementLevel={params.maxEnhancementLevel}
          onMinEnhancementLevelChange={(v) => setParams({ minEnhancementLevel: v })}
          onMaxEnhancementLevelChange={(v) => setParams({ maxEnhancementLevel: v })}
          minAbsorbExperience={params.minAbsorbExperience}
          maxAbsorbExperience={params.maxAbsorbExperience}
          onMinAbsorbExperienceChange={(v) => setParams({ minAbsorbExperience: v })}
          onMaxAbsorbExperienceChange={(v) => setParams({ maxAbsorbExperience: v })}
        />

        {params.serverId === undefined ? (
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
