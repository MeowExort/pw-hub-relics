import { Link, useParams } from 'react-router-dom'
import { Spinner } from '@/shared/ui'
import { useRelicDetail } from '@/shared/hooks'
import clsx from 'clsx'
import { PriceHistoryChart } from './PriceHistoryChart'
import styles from './RelicDetailPage.module.scss'

/** Маппинг типов души */
const SOUL_TYPE_NAMES: Record<number, string> = {
    1: 'Душа Покоя',
    2: 'Душа Тяньюя',
}

/** Маппинг рас */
const RACE_NAMES: Record<number, string> = {
  1: 'Люди',
  2: 'Зооморфы',
  3: 'Сиды',
  4: 'Амфибии',
  5: 'Древние',
  6: 'Тени',
}

/** Форматирование даты */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Детальная страница реликвии */
export function RelicDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: relic, isLoading, isError } = useRelicDetail(id)

  if (isLoading) {
    return (
      <div className={styles.center}>
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError || !relic) {
    return <div className={styles.error}>Реликвия не найдена.</div>
  }

  const def = relic.relicDefinition

  return (
    <div className={styles.page}>
      <Link to="/search" className={styles.backLink}>
        ← Назад к поиску
      </Link>

      <div className={styles.card}>
        {/* Header: иконка + название + цена */}
        <div className={styles.header}>
          {def.iconUri && (
            <img src={def.iconUri} alt={def.name} className={styles.icon} />
          )}
          <div className={styles.titleBlock}>
            <h1 className={styles.title}>
              {def.name}
              {relic.enhancementLevel > 0 && ` +${relic.enhancementLevel}`}
            </h1>
            <span className={styles.subtitle}>
              {SOUL_TYPE_NAMES[def.soulType] ?? `Тип ${def.soulType}`} ·{' '}
              {RACE_NAMES[def.race] ?? `Раса ${def.race}`} · {def.slotType.name} · {relic.server.name}
            </span>
          </div>
          <span className={styles.price}>{relic.priceFormatted}</span>
        </div>

        <div className={styles.divider} />

        {/* Атрибуты */}
        <div>
          <div className={styles.sectionTitle}>Атрибуты</div>
          <div className={styles.attrList}>
            <div className={clsx(styles.attrRow, styles.mainAttr)}>
              <span className={styles.attrName}>{relic.mainAttribute.attributeDefinition.name}</span>
              <span className={styles.attrValue}>{relic.mainAttribute.value}</span>
            </div>
            {relic.additionalAttributes.length > 0 && (
              <div className={styles.attrDivider} />
            )}
            {relic.additionalAttributes.map((attr, idx) => (
              <div key={idx} className={styles.attrRow}>
                <span className={styles.attrName}>{attr.attributeDefinition.name}</span>
                <span className={styles.attrValue}>{attr.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.divider} />

        {/* Информация */}
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Заточка</span>
            <span className={styles.infoValue}>+{relic.enhancementLevel}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Опыт</span>
            <span className={styles.infoValue}>{relic.absorbExperience.toLocaleString('ru-RU')}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Добавлено</span>
            <span className={styles.infoValue}>{formatDate(relic.createdAt)}</span>
          </div>
        </div>

        <div className={styles.divider} />

        {/* История цен по похожим */}
        <PriceHistoryChart relic={relic} />
      </div>
    </div>
  )
}
