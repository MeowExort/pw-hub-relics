import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner, Pagination, Select, Button } from '@/shared/ui'
import { useRelicsSearch, useDictionaries } from '@/shared/hooks'
import { isAuthenticated } from '@/shared/api/auth'
import type { FilterCriteriaDto } from '@/shared/types'
import { useRelicSearchParams } from './useSearchParams'
import { SearchFilters } from './components/SearchFilters'
import { RelicCard } from './components/RelicCard'
import { ViewToggle } from './components/ViewToggle'
import { ActiveFilterChips } from './components/ActiveFilterChips'
import styles from './SearchPage.module.scss'

/** Подсчитывает количество активных фильтров */
function countActiveFilters(params: Record<string, any>): number {
  const filterKeys = [
    'serverId', 'soulType', 'race', 'soulLevel', 'slotTypeId', 'mainAttributeId',
    'minPrice', 'maxPrice', 'minEnhancementLevel', 'maxEnhancementLevel',
    'minAbsorbExperience', 'maxAbsorbExperience',
  ]
  let count = filterKeys.filter((k) => params[k] != null).length
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
  const navigate = useNavigate()
  const authenticated = isAuthenticated()

  /** Подписаться на текущий фильтр — переход на страницу подписок с критериями */
  const handleSubscribe = useCallback(() => {
    const criteria: FilterCriteriaDto = {}
    if (params.serverId != null) criteria.serverId = params.serverId
    if (params.soulType != null) criteria.soulType = params.soulType
    if (params.race != null) criteria.race = params.race
    if (params.soulLevel != null) criteria.soulLevel = params.soulLevel
    if (params.slotTypeId != null) criteria.slotTypeId = params.slotTypeId
    if (params.mainAttributeId != null) criteria.mainAttributeId = params.mainAttributeId
    if (params.minPrice != null) criteria.minPrice = params.minPrice
    if (params.maxPrice != null) criteria.maxPrice = params.maxPrice
    if (params.additionalAttributes?.length) {
      criteria.requiredAdditionalAttributeIds = params.additionalAttributes.map((a: any) => a.id)
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
          {authenticated && (
            <Button variant="secondary" size="sm" onClick={handleSubscribe}>
              🔔 Подписаться на фильтр
            </Button>
          )}
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {filtersOpen && (
        <SearchFilters params={params} onChange={setParams} onReset={resetParams} />
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
