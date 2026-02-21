import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button, Modal, Spinner } from '@/shared/ui'
import { useNotificationFilters } from '@/shared/hooks'
import { generateTelegramLink } from '@/shared/api'
import styles from './SubscriptionsPage.module.scss'

/** Страница управления подписками и уведомлениями */
export function SubscriptionsPage() {
  const { filters, isLoading, isError, create, isCreating, remove, isRemoving } =
    useNotificationFilters()

  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const telegramMutation = useMutation({
    mutationFn: generateTelegramLink,
  })

  /** Создание новой подписки */
  const handleCreate = async () => {
    if (!newName.trim()) return
    await create({ name: newName.trim(), criteria: {} })
    setNewName('')
    setShowCreate(false)
  }

  /** Подтверждение удаления */
  const handleDelete = async () => {
    if (!deleteId) return
    await remove(deleteId)
    setDeleteId(null)
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

      {/* Telegram-привязка */}
      <div className={styles.telegramSection}>
        <h2 className={styles.telegramTitle}>Telegram-уведомления</h2>
        <p className={styles.telegramDesc}>
          Привяжите Telegram-аккаунт, чтобы получать уведомления о новых реликвиях.
        </p>
        {telegramMutation.data ? (
          <a
            href={telegramMutation.data.link}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.telegramLink}
          >
            Открыть бота в Telegram
          </a>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            loading={telegramMutation.isPending}
            onClick={() => telegramMutation.mutate()}
          >
            Привязать Telegram
          </Button>
        )}
      </div>

      {/* Список подписок */}
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
            <div key={filter.id} className={styles.card} data-testid="subscription-card">
              <div className={styles.cardInfo}>
                <span className={styles.cardName}>{filter.name}</span>
                <span className={styles.cardMeta}>
                  Создана: {formatDate(filter.createdAt)} ·{' '}
                  {filter.isActive ? '✅ Активна' : '⏸ Приостановлена'}
                </span>
              </div>
              <div className={styles.cardActions}>
                <Button
                  variant="danger"
                  size="sm"
                  loading={isRemoving}
                  onClick={() => setDeleteId(filter.id)}
                >
                  Удалить
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модалка создания */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Новая подписка">
        <div className={styles.modalBody}>
          <input
            className={styles.input}
            placeholder="Название подписки"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            aria-label="Название подписки"
          />
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>
              Отмена
            </Button>
            <Button loading={isCreating} onClick={handleCreate}>
              Создать
            </Button>
          </div>
        </div>
      </Modal>

      {/* Модалка подтверждения удаления */}
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
