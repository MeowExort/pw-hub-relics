import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Button, Modal, Spinner, Select, Toggle } from '@/shared/ui'
import { useNotificationFilters, useTelegramBinding, useNotificationSettings, useDictionaries } from '@/shared/hooks'
import { NotificationFrequency } from '@/shared/types'
import type { FilterCriteriaDto, NotificationFilter } from '@/shared/types'
import styles from './SubscriptionsPage.module.scss'

/** Маппинг типов души */
const SOUL_TYPES: Record<number, string> = { 1: 'Душа Покоя', 2: 'Душа Тяньюя' }
const RACES: Record<number, string> = {
  1: 'Люди', 2: 'Зооморфы', 3: 'Сиды', 4: 'Амфибии', 5: 'Древние', 6: 'Тени',
}

const FREQUENCY_OPTIONS = [
  { value: NotificationFrequency.Instant, label: 'Мгновенно' },
  { value: NotificationFrequency.Hourly, label: 'Раз в час' },
  { value: NotificationFrequency.Daily, label: 'Раз в день (дайджест)' },
]

/** Превью критериев фильтра */
function FilterPreview({ criteria, servers, slotTypes, attributes }: {
  criteria: FilterCriteriaDto
  servers: { id: number; name: string }[]
  slotTypes: { id: number; name: string }[]
  attributes: { id: number; name: string }[]
}) {
  const parts: string[] = []

  if (criteria.serverId != null) {
    const s = servers.find((x) => x.id === criteria.serverId)
    if (s) parts.push(`Сервер: ${s.name}`)
  }
  if (criteria.soulType != null) parts.push(`Тип души: ${SOUL_TYPES[criteria.soulType] ?? criteria.soulType}`)
  if (criteria.race != null) parts.push(`Раса: ${RACES[criteria.race] ?? criteria.race}`)
  if (criteria.slotTypeId != null) {
    const st = slotTypes.find((x) => x.id === criteria.slotTypeId)
    if (st) parts.push(`Слот: ${st.name}`)
  }
  if (criteria.mainAttributeId != null) {
    const a = attributes.find((x) => x.id === criteria.mainAttributeId)
    if (a) parts.push(`Осн. атрибут: ${a.name}`)
  }
  if (criteria.requiredAdditionalAttributeIds?.length) {
    const names = criteria.requiredAdditionalAttributeIds
      .map((id) => attributes.find((x) => x.id === id)?.name ?? `#${id}`)
    parts.push(`Доп. атрибуты: ${names.join(', ')}`)
  }
  if (criteria.minPrice != null) parts.push(`Цена от: ${criteria.minPrice}`)
  if (criteria.maxPrice != null) parts.push(`Цена до: ${criteria.maxPrice}`)

  if (parts.length === 0) return <span className={styles.previewEmpty}>Без фильтров (все реликвии)</span>

  return (
    <div className={styles.preview}>
      {parts.map((p, i) => (
        <span key={i} className={styles.previewTag}>{p}</span>
      ))}
    </div>
  )
}

/** Страница управления подписками и уведомлениями */
export function SubscriptionsPage() {
  const {
    filters, isLoading, isError,
    create, isCreating,
    update, isUpdating,
    toggle, isToggling,
    remove, isRemoving,
  } = useNotificationFilters()

  const telegram = useTelegramBinding()
  const notifSettings = useNotificationSettings()
  const { servers, slotTypes, attributes } = useDictionaries()

  // --- Навигация с критериями из SearchPage ---
  const location = useLocation()
  const incomingCriteria = (location.state as { criteria?: FilterCriteriaDto } | null)?.criteria ?? null

  // --- Состояния модалок ---
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [createCriteria, setCreateCriteria] = useState<FilterCriteriaDto>({})
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editFilter, setEditFilter] = useState<NotificationFilter | null>(null)
  const [editName, setEditName] = useState('')

  /** Автооткрытие модалки создания при переходе с SearchPage */
  useEffect(() => {
    if (incomingCriteria) {
      setCreateCriteria(incomingCriteria)
      setShowCreate(true)
      // Очищаем state, чтобы при обновлении страницы модалка не открывалась повторно
      window.history.replaceState({}, '')
    }
  }, [incomingCriteria])

  // --- Настройки уведомлений ---
  const [quietStart, setQuietStart] = useState('')
  const [quietEnd, setQuietEnd] = useState('')

  /** Создание новой подписки */
  const handleCreate = async () => {
    if (!newName.trim()) return
    await create({ name: newName.trim(), criteria: createCriteria })
    setNewName('')
    setCreateCriteria({})
    setShowCreate(false)
  }

  /** Подтверждение удаления */
  const handleDelete = async () => {
    if (!deleteId) return
    await remove(deleteId)
    setDeleteId(null)
  }

  /** Сохранение редактирования */
  const handleEditSave = async () => {
    if (!editFilter || !editName.trim()) return
    await update({ id: editFilter.id, data: { name: editName.trim(), criteria: editFilter.criteria } })
    setEditFilter(null)
    setEditName('')
  }

  /** Открытие редактирования */
  const openEdit = (filter: NotificationFilter) => {
    setEditFilter(filter)
    setEditName(filter.name)
  }

  /** Форматирование даты */
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })


  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Подписки</h1>
        <Button onClick={() => setShowCreate(true)}>Создать подписку</Button>
      </div>

      {/* ===== Telegram-привязка ===== */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Telegram-уведомления</h2>

        {telegram.isLoading ? (
          <Spinner size="sm" />
        ) : telegram.status?.isLinked ? (
          <div className={styles.telegramBound}>
            <span className={styles.telegramStatus}>
              ✅ Привязан{telegram.status.telegramUsername ? `: @${telegram.status.telegramUsername}` : ''}
            </span>
            <div className={styles.telegramActions}>
              <Button
                variant="secondary"
                size="sm"
                loading={telegram.isSendingTest}
                onClick={() => telegram.sendTest()}
              >
                Тестовое уведомление
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={telegram.isUnbinding}
                onClick={() => telegram.unbind()}
              >
                Отвязать
              </Button>
            </div>
            {telegram.testSuccess && (
              <span className={styles.testSuccess}>Тестовое уведомление отправлено!</span>
            )}
          </div>
        ) : (
          <div className={styles.telegramUnbound}>
            <p className={styles.sectionDesc}>
              Привяжите Telegram-аккаунт, чтобы получать уведомления о новых реликвиях.
            </p>
            <Button
              variant="secondary"
              size="sm"
              loading={telegram.isGenerating}
              onClick={() => telegram.generateLink()}
            >
              {telegram.generatedLink ? 'Открыть бота снова' : 'Привязать Telegram'}
            </Button>
          </div>
        )}
      </section>

      {/* ===== Настройки уведомлений ===== */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Настройки уведомлений</h2>

        {notifSettings.isLoading ? (
          <Spinner size="sm" />
        ) : notifSettings.settings ? (
          <div className={styles.settingsGrid}>
            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Частота уведомлений</span>
              <Select
                options={FREQUENCY_OPTIONS}
                value={notifSettings.settings.frequency}
                onChange={(v) => {
                  if (v != null) notifSettings.update({ frequency: Number(v) as NotificationFrequency })
                }}
              />
            </div>

            <div className={styles.settingRow}>
              <span className={styles.settingLabel}>Тихие часы</span>
              <Toggle
                checked={notifSettings.settings.quietHoursEnabled}
                disabled={notifSettings.isUpdating}
                onChange={(checked) =>
                  notifSettings.update({ quietHoursEnabled: checked })
                }
                aria-label="Тихие часы"
              />
            </div>

            {notifSettings.settings.quietHoursEnabled && (
              <div className={styles.quietHours}>
                <div className={styles.timeInputGroup}>
                  <label className={styles.timeLabel}>С</label>
                  <input
                    type="time"
                    className={styles.input}
                    value={quietStart || notifSettings.settings.quietHoursStart || ''}
                    onChange={(e) => setQuietStart(e.target.value)}
                    onBlur={() => {
                      if (quietStart) notifSettings.update({ quietHoursStart: quietStart })
                    }}
                  />
                </div>
                <div className={styles.timeInputGroup}>
                  <label className={styles.timeLabel}>До</label>
                  <input
                    type="time"
                    className={styles.input}
                    value={quietEnd || notifSettings.settings.quietHoursEnd || ''}
                    onChange={(e) => setQuietEnd(e.target.value)}
                    onBlur={() => {
                      if (quietEnd) notifSettings.update({ quietHoursEnd: quietEnd })
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className={styles.sectionDesc}>Не удалось загрузить настройки.</p>
        )}
      </section>

      {/* ===== Список подписок ===== */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Активные подписки</h2>

        {isLoading && (
          <div className={styles.center}>
            <Spinner size="lg" />
          </div>
        )}

        {isError && <div className={styles.error}>Ошибка загрузки подписок.</div>}

        {!isLoading && !isError && filters.length === 0 && (
          <div className={styles.empty}>
            У вас пока нет подписок. Создайте первую!
          </div>
        )}

        {filters.length > 0 && (
          <div className={styles.list}>
            {filters.map((filter) => (
              <div
                key={filter.id}
                className={`${styles.card} ${!filter.isEnabled ? styles.cardInactive : ''}`}
                data-testid="subscription-card"
              >
                <div className={styles.cardLeft}>
                  <Toggle
                    checked={filter.isEnabled}
                    disabled={isToggling}
                    onChange={(checked) => toggle({ id: filter.id, isEnabled: checked })}
                    aria-label={`Переключить подписку ${filter.name}`}
                  />
                  <div className={styles.cardInfo}>
                    <span className={styles.cardName}>{filter.name}</span>
                    <span className={styles.cardMeta}>
                      Создана: {formatDate(filter.createdAt)} ·{' '}
                      {filter.isEnabled ? '✅ Активна' : '⏸ Приостановлена'}
                    </span>
                    <FilterPreview
                      criteria={filter.criteria}
                      servers={servers}
                      slotTypes={slotTypes}
                      attributes={attributes}
                    />
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(filter)}>
                    Редактировать
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteId(filter.id)}
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===== Модалка создания ===== */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setCreateCriteria({}) }} title="Новая подписка">
        <div className={styles.modalBody}>
          <input
            className={styles.input}
            placeholder="Название подписки"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            aria-label="Название подписки"
          />
          {Object.keys(createCriteria).length > 0 ? (
            <>
              <div className={styles.editPreviewLabel}>Фильтр подписки:</div>
              <FilterPreview
                criteria={createCriteria}
                servers={servers}
                slotTypes={slotTypes}
                attributes={attributes}
              />
            </>
          ) : (
            <p className={styles.modalHint}>
              Подписка будет создана без фильтров. Вы сможете настроить критерии позже через редактирование.
            </p>
          )}
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={() => { setShowCreate(false); setCreateCriteria({}) }}>
              Отмена
            </Button>
            <Button loading={isCreating} onClick={handleCreate}>
              Создать
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===== Модалка редактирования ===== */}
      <Modal
        open={editFilter !== null}
        onClose={() => setEditFilter(null)}
        title="Редактировать подписку"
      >
        <div className={styles.modalBody}>
          <input
            className={styles.input}
            placeholder="Название подписки"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            aria-label="Название подписки"
          />
          {editFilter && (
            <>
              <div className={styles.editPreviewLabel}>Текущий фильтр:</div>
              <FilterPreview
                criteria={editFilter.criteria}
                servers={servers}
                slotTypes={slotTypes}
                attributes={attributes}
              />
            </>
          )}
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={() => setEditFilter(null)}>
              Отмена
            </Button>
            <Button loading={isUpdating} onClick={handleEditSave}>
              Сохранить
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===== Модалка подтверждения удаления ===== */}
      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Удалить подписку?"
      >
        <div className={styles.modalBody}>
          <p>Вы уверены, что хотите удалить эту подписку? Действие необратимо.</p>
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Отмена
            </Button>
            <Button variant="danger" loading={isRemoving} onClick={handleDelete}>
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
