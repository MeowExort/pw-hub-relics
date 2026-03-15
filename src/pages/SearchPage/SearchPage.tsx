import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner, Pagination, Select, Button } from '@/shared/ui'
import { useRelicsSearch, useDictionaries, useNotificationFilters } from '@/shared/hooks'
import { isAuthenticated } from '@/shared/api/auth'
import type { FilterCriteriaDto, NotificationFilter } from '@/shared/types'
import { useRelicSearchParams } from './useSearchParams'
import { SearchFilters } from './components/SearchFilters'
import { RelicCard } from './components/RelicCard'
import { ViewToggle } from './components/ViewToggle'
import { ActiveFilterChips } from './components/ActiveFilterChips'
import { AttributeColorSettingsModal } from './components/AttributeColorSettingsModal'
import styles from './SearchPage.module.scss'

/** Подсчитывает количество активных фильтров */
function countActiveFilters(params: Record<string, any>): number {
  const filterKeys = [
    'serverId', 'soulType', 'race', 'soulLevel', 'slotTypeId',
    'minPrice', 'maxPrice', 'minEnhancementLevel', 'maxEnhancementLevel',
    'minAbsorbExperience', 'maxAbsorbExperience',
  ]
  let count = filterKeys.filter((k) => params[k] != null).length
  if (params.mainAttributeIds?.length) count++
  if (params.additionalAttributes?.length > 0) {
    count += params.additionalAttributes.length
  }
  return count
}

/** Страница поиска реликвий */
export function SearchPage() {
  const { params, setParams, resetParams } = useRelicSearchParams()
  const { data, isLoading, isError } = useRelicsSearch(params)
  const { attributes } = useDictionaries()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const navigate = useNavigate()
  const authenticated = isAuthenticated()
  const { filters: subscriptions } = useNotificationFilters()

  /** Применить фильтр из подписки */
  const handleApplySubscription = useCallback((filter: NotificationFilter) => {
    const c = filter.criteria
    setParams({
      serverId: c.serverId ?? undefined,
      soulType: c.soulType ?? undefined,
      race: c.race ?? undefined,
      soulLevel: c.soulLevel ?? undefined,
      slotTypeId: c.slotTypeId ?? undefined,
      mainAttributeIds: c.mainAttributeIds ?? undefined,
      additionalAttributes: c.additionalAttributes ?? [],
      minPrice: c.minPrice != null ? c.minPrice / 100 : undefined,
      maxPrice: c.maxPrice != null ? c.maxPrice / 100 : undefined,
      minEnhancementLevel: c.minEnhancementLevel ?? undefined,
      maxEnhancementLevel: c.maxEnhancementLevel ?? undefined,
      minAbsorbExperience: c.minAbsorbExperience ?? undefined,
      maxAbsorbExperience: c.maxAbsorbExperience ?? undefined,
    })
  }, [setParams])

  /** Подписаться на текущий фильтр — переход на страницу подписок с критериями */
  const handleSubscribe = useCallback(() => {
    const criteria: FilterCriteriaDto = {}
    if (params.serverId != null) criteria.serverId = params.serverId
    if (params.soulType != null) criteria.soulType = params.soulType
    if (params.race != null) criteria.race = params.race
    if (params.soulLevel != null) criteria.soulLevel = params.soulLevel
    if (params.slotTypeId != null) criteria.slotTypeId = params.slotTypeId
    if (params.mainAttributeIds?.length) criteria.mainAttributeIds = params.mainAttributeIds
    if (params.minPrice != null) criteria.minPrice = params.minPrice * 100
    if (params.maxPrice != null) criteria.maxPrice = params.maxPrice * 100
    if (params.minEnhancementLevel != null) criteria.minEnhancementLevel = params.minEnhancementLevel
    if (params.maxEnhancementLevel != null) criteria.maxEnhancementLevel = params.maxEnhancementLevel
    if (params.minAbsorbExperience != null) criteria.minAbsorbExperience = params.minAbsorbExperience
    if (params.maxAbsorbExperience != null) criteria.maxAbsorbExperience = params.maxAbsorbExperience
    if (params.additionalAttributes?.length) {
      criteria.additionalAttributes = params.additionalAttributes
    }
    navigate('/subscriptions', { state: { criteria } })
  }, [params, navigate])

  const activeFiltersCount = useMemo(() => countActiveFilters(params), [params])

  /** ID доп. атрибутов, по которым идёт фильтрация (для подсветки в карточках) */
  const highlightedAttrIds = useMemo(
    () => new Set((params.additionalAttributes ?? []).map((a: any) => a.id)),
    [params.additionalAttributes],
  )

  const sortOptions = [
    { value: 'CreatedAt', label: 'Дата добавления' },
    { value: 'Price', label: 'Цена' },
    { value: 'SoulLevel', label: 'Уровень' },
    { value: 'EnhancementLevel', label: 'Заточка' },
    { value: 'AbsorbExperience', label: 'Опыт поглощения' },
    { value: 'Attribute', label: 'Значение атрибута' },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <h1 className={styles.title}>Поиск реликвий</h1>
        <div className={styles.toolbarActions}>
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
          <button
            type="button"
            className={styles.filtersToggle}
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            Фильтры
            {activeFiltersCount > 0 && (
              <span className={styles.filtersBadge}>{activeFiltersCount}</span>
            )}
            <span className={styles.filtersArrow}>{filtersOpen ? '▲' : '▼'}</span>
          </button>
          <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)} title="Настройка подсветки">
            🎨
          </Button>
          {/*<ViewToggle value={view} onChange={setView} />*/}
        </div>
      </div>

      <AttributeColorSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {filtersOpen && (
        <SearchFilters
          params={params}
          onChange={setParams}
          onReset={resetParams}
          onSubscribe={authenticated ? handleSubscribe : undefined}
        />
      )}

      <ActiveFilterChips params={params} onChange={setParams} onReset={resetParams} />

      {isLoading && (
        <div className={styles.center}>
          <Spinner size="lg" />
        </div>
      )}

      {isError && (
        <div className={styles.error}>Ошибка загрузки. Попробуйте позже.</div>
      )}

      {data && data.items.length === 0 && (
        <div className={styles.empty}>Реликвии не найдены. Попробуйте изменить фильтры.</div>
      )}

      {data && (
        <>
          <div className={styles.resultsToolbar}>
            <span className={styles.count}>
              Найдено: {data.totalCount.toLocaleString('ru-RU')}
            </span>

            <div className={styles.sorting}>
              <Select
                placeholder="Сортировка по"
                options={sortOptions}
                value={params.sortBy || ''}
                onChange={(v) => setParams({ sortBy: v || undefined, sortAttributeId: v !== 'Attribute' ? undefined : params.sortAttributeId })}
                className={styles.sortSelect}
              />

              {params.sortBy === 'Attribute' && (
                <Select
                  placeholder="Выберите атрибут"
                  options={attributes.map(a => ({ value: a.id, label: a.name }))}
                  value={params.sortAttributeId || ''}
                  onChange={(v) => setParams({ sortAttributeId: v ? Number(v) : undefined })}
                  className={styles.sortSelect}
                />
              )}

              <button
                type="button"
                className={styles.directionToggle}
                onClick={() => setParams({ sortDirection: params.sortDirection === 'asc' ? 'desc' : 'asc' })}
                aria-label="Направление сортировки"
                title={params.sortDirection === 'asc' ? 'По возрастанию' : 'По убыванию'}
              >
                {params.sortDirection === 'asc' ? '↑ По возрастанию' : '↓ По убыванию'}
              </button>
            </div>
          </div>

          {data.items.length > 0 && (
            <>
              <div className={view === 'grid' ? styles.grid : styles.list}>
                {data.items.map((relic) => (
                  <RelicCard key={relic.id} relic={relic} view={view} highlightedAttributeIds={highlightedAttrIds} />
                ))}
              </div>

              <Pagination
                page={data.pageNumber}
                totalPages={data.totalPages}
                onPageChange={(p) => setParams({ pageNumber: p })}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
