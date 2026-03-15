import { Link } from 'react-router-dom'
import clsx from 'clsx'
import type { RelicListItem } from '@/shared/types'
import { useAttributeStyles } from '@/shared/hooks'
import styles from './RelicCard.module.scss'

interface RelicCardProps {
  /** Данные реликвии */
  relic: RelicListItem
  /** Режим отображения */
  view?: 'grid' | 'list'
  /** ID доп. атрибутов, по которым идёт фильтрация (для подсветки) */
  highlightedAttributeIds?: Set<number>
}

  /** Убирает суффикс "(N ур.)" из названия реликвии */
function cleanRelicName(name: string): string {
  return name.replace(/\s*\(\d+\s*ур\.\)\s*$/, '')
}

/** Возвращает класс для окрашивания уровня души */
function getSoulLevelClass(level: number): string {
  switch (level) {
    case 1:
      return styles.soulLevel1
    case 2:
      return styles.soulLevel2
    case 3:
      return styles.soulLevel3
    case 4:
      return styles.soulLevel4
    case 5:
      return styles.soulLevel5
    default:
      return ''
  }
}

/** Карточка реликвии в каталоге */
export function RelicCard({ relic, view = 'grid', highlightedAttributeIds }: RelicCardProps) {
  const def = relic.relicDefinition
  const displayName = cleanRelicName(def.name)
  const { getAttributeColor } = useAttributeStyles()

  return (
    <Link
      to={`/relics/${relic.id}`}
      className={clsx(styles.card, view === 'list' && styles.listView)}
      data-testid="relic-card"
    >
      <div className={styles.header}>
        {def.iconUri && (
          <img src={def.iconUri} alt={displayName} className={styles.icon} />
        )}
        <div className={styles.headerInfo}>
          <span className={styles.name}>{displayName}</span>
          <span className={clsx(styles.soulLevel, getSoulLevelClass(def.soulLevel))}>
            Ур. {def.soulLevel}
          </span>
        </div>
        {relic.enhancementLevel > 0 && (
          <span className={styles.enhancementBadge}>+{relic.enhancementLevel}</span>
        )}
      </div>

      <div className={styles.attributes}>
        <div className={clsx(styles.attribute, styles.mainAttr)}>
          <span 
            className={styles.attrName}
            style={getAttributeColor(relic.mainAttribute.attributeDefinition.id, relic.mainAttribute.value) ? { color: getAttributeColor(relic.mainAttribute.attributeDefinition.id, relic.mainAttribute.value)! } : undefined}
          >
            {relic.mainAttribute.attributeDefinition.name}
          </span>
          <span 
            className={styles.attrValue}
            style={getAttributeColor(relic.mainAttribute.attributeDefinition.id, relic.mainAttribute.value) ? { color: getAttributeColor(relic.mainAttribute.attributeDefinition.id, relic.mainAttribute.value)! } : undefined}
          >
            {relic.mainAttribute.value}
          </span>
        </div>
        {relic.additionalAttributes.length > 0 && (
          <div className={styles.attrDivider} />
        )}
        {relic.additionalAttributes.map((attr, idx) => {
          const isHighlighted = highlightedAttributeIds?.has(attr.attributeDefinition.id)
          const userColor = getAttributeColor(attr.attributeDefinition.id, attr.value)
          
          return (
            <div key={idx} className={clsx(styles.attribute, isHighlighted && styles.highlightedAttr)}>
              <span 
                className={styles.attrName}
                style={userColor ? { color: userColor } : undefined}
              >
                {attr.attributeDefinition.name}
              </span>
              <span 
                className={styles.attrValue}
                style={userColor ? { color: userColor } : undefined}
              >
                {attr.value}
              </span>
            </div>
          )
        })}
      </div>

      <div className={styles.footer}>
        <span className={styles.price}>{relic.priceFormatted}</span>
        <span className={styles.meta}>{relic.server.name}</span>
      </div>
    </Link>
  )
}
