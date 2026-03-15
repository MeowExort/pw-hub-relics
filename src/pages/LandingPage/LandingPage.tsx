import { startLogin } from '@/shared/api/auth'
import styles from './LandingPage.module.scss'

/**
 * Лендинг-страница приложения.
 * Отображается для неавторизованных пользователей на главной.
 * Содержит описание функций и кнопку входа.
 */
export function LandingPage() {
  /** Обработчик нажатия кнопки «Войти» */
  const handleLogin = () => {
    startLogin()
  }

  return (
    <div className={styles.landing}>
      <section className={styles.hero}>
        <h1 className={styles.title}>
          PW Hub <span className={styles.accent}>Relics</span>
        </h1>
        <p className={styles.subtitle}>
          Умный поиск и аналитика реликвий Perfect World
        </p>
        <button className={styles.loginButton} onClick={handleLogin}>
          Войти
        </button>
      </section>

      <section className={styles.features}>
        <div className={styles.feature}>
          <div className={styles.featureIcon}>🔍</div>
          <h3 className={styles.featureTitle}>Поиск реликвий</h3>
          <p className={styles.featureDescription}>
            Гибкая система фильтрации по типу, расе, уровню, цене и характеристикам.
            Находите идеальные реликвии за секунды.
          </p>
        </div>

        <div className={styles.feature}>
          <div className={styles.featureIcon}>📊</div>
          <h3 className={styles.featureTitle}>Аналитика цен</h3>
          <p className={styles.featureDescription}>
            Интерактивные графики трендов, сравнение цен и объёмов торгов.
            Принимайте решения на основе данных.
          </p>
        </div>

        <div className={styles.feature}>
          <div className={styles.featureIcon}>🔔</div>
          <h3 className={styles.featureTitle}>Уведомления</h3>
          <p className={styles.featureDescription}>
            Подписки на появление нужных реликвий с мгновенными уведомлениями
            в Telegram. Не упустите выгодное предложение.
          </p>
        </div>

        <div className={styles.feature}>
          <div className={styles.featureIcon}>📖</div>
          <h3 className={styles.featureTitle}>Калькуляторы</h3>
          <p className={styles.featureDescription}>
            Калькулятор заточки, профитные квесты и рекомендации по оптимизации
            игрового процесса.
          </p>
        </div>
      </section>
    </div>
  )
}
