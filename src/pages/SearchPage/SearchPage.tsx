import { useState } from 'react'
import { Spinner, Pagination, Select } from '@/shared/ui'
import { useRelicsSearch, useDictionaries } from '@/shared/hooks'
import { useRelicSearchParams } from './useSearchParams'
import { SearchFilters } from './components/SearchFilters'
import { RelicCard } from './components/RelicCard'
import { ViewToggle } from './components/ViewToggle'
import styles from './SearchPage.module.scss'

/** Страница поиска реликвий */
export function SearchPage() {
  const { params, setParams, resetParams } = useRelicSearchParams()
  const { data, isLoading, isError } = useRelicsSearch(params)
  const { attributes } = useDictionaries()
  const [view, setView] = useState<'grid' | 'list'>('grid')

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
        <ViewToggle value={view} onChange={setView} />
      </div>

      <SearchFilters params={params} onChange={setParams} onReset={resetParams} />

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

              <Select
                placeholder="Направление"
                options={[
                  { value: 'desc', label: 'По убыванию' },
                  { value: 'asc', label: 'По возрастанию' },
                ]}
                value={params.sortDirection || ''}
                onChange={(v) => setParams({ sortDirection: (v as 'asc' | 'desc') || undefined })}
                className={styles.sortSelect}
              />
            </div>
          </div>

          {data.items.length > 0 && (
            <>
              <div className={view === 'grid' ? styles.grid : styles.list}>
                {data.items.map((relic) => (
                  <RelicCard key={relic.id} relic={relic} view={view} />
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
