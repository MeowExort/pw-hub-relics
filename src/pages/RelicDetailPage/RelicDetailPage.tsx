import { Link, useParams } from 'react-router-dom'
import { Spinner } from '@/shared/ui'
import { useRelicDetail } from '@/shared/hooks'
import clsx from 'clsx'
import styles from './RelicDetailPage.module.scss'

/** Маппинг типов души */
const SOUL_TYPE_NAMES: Record<number, string> = {
  0: 'Дракон',
  1: 'Тигр',
  2: 'Черепаха',
  3: 'Феникс',
}

/** Маппинг рас */
const RACE_NAMES: Record<number, string> = {
  0: 'Люди',
  1: 'Зооморфы',
  2: 'Сиды',
  3: 'Амфибии',
  4: 'Древние',
  5: 'Тени',
}

/** Форматирование цены */
function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU')
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

      <div className={styles.header}>
        <div className={styles.titleBlock}>
          {def.iconUri && (
            <img src={def.iconUri} alt={def.name} className={styles.icon} />
          )}
          <div>
            <h1 className={styles.title}>
              {def.name}
              {relic.enhancementLevel > 0 && ` +${relic.enhancementLevel}`}
            </h1>
            <span className={styles.subtitle}>
              {SOUL_TYPE_NAMES[def.soulType] ?? `Тип ${def.soulType}`} ·{' '}
              {RACE_NAMES[def.race] ?? `Раса ${def.race}`} · {def.slotType.name} · {relic.server.name}
            </span>
          </div>
        </div>
        <span className={styles.price}>{relic.priceFormatted}</span>
      </div>

      <div className={styles.sections}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Атрибуты</h2>
          <div className={styles.attrList}>
            <div className={clsx(styles.attrRow, styles.mainAttr)}>
              <span className={styles.attrName}>{relic.mainAttribute.attributeDefinition.name}</span>
              <span className={styles.attrValue}>{relic.mainAttribute.value}</span>
            </div>
            {relic.additionalAttributes.map((attr, idx) => (
              <div key={idx} className={styles.attrRow}>
                <span className={styles.attrName}>{attr.attributeDefinition.name}</span>
                <span className={styles.attrValue}>{attr.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Информация</h2>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Уровень заточки</span>
              <span className={styles.infoValue}>+{relic.enhancementLevel}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Опыт поглощения</span>
              <span className={styles.infoValue}>{relic.absorbExperience.toLocaleString('ru-RU')}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Дата добавления</span>
              <span className={styles.infoValue}>{formatDate(relic.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
