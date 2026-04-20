import { Outlet, NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { isAuthenticated } from '@/shared/api/auth'
import { UserMenu } from '@/shared/ui/UserMenu'
import { AppSwitcher, APPS, CURRENT_APP_ID } from '@/shared/ui/AppSwitcher'
import styles from './MainLayout.module.scss'

/** Основной лейаут приложения: хедер, навигация, контент */
export function MainLayout() {
  const authenticated = isAuthenticated()

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <AppSwitcher />
          <NavLink to="/" className={styles.logo}>
            <img src="/icon-relics.png" alt="" className={styles.logoIcon} />
            Реликвии
          </NavLink>
          {authenticated && (
            <nav className={styles.nav}>
              <NavLink
                to="/"
                end
                className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}
              >
                Поиск
              </NavLink>
              <NavLink
                to="/subscriptions"
                className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}
              >
                Подписки
              </NavLink>
              <NavLink
                to="/analytics"
                className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}
              >
                Аналитика
              </NavLink>
              <NavLink
                to="/guides"
                className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}
              >
                Калькуляторы
              </NavLink>
            </nav>
          )}
          {authenticated && <UserMenu />}
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerHead}>
            <div className={styles.footerBrand}>PW Hub</div>
            <div className={styles.footerTagline}>
              Единая экосистема инструментов для Perfect World
            </div>
          </div>
          <div className={styles.footerApps}>
            {APPS.map((app) => {
              const current = app.id === CURRENT_APP_ID
              return (
                <a
                  key={app.id}
                  href={app.url}
                  rel="noopener"
                  className={clsx(styles.footerApp, current && styles.footerAppCurrent)}
                >
                  <span
                    className={styles.footerAppIcon}
                    style={{ background: app.color }}
                    aria-hidden="true"
                  >
                    {app.iconSrc ? (
                      <img src={app.iconSrc} alt="" className={styles.footerAppIconImg} />
                    ) : (
                      app.icon
                    )}
                  </span>
                  <span className={styles.footerAppBody}>
                    <span className={styles.footerAppTitle}>
                      {app.title}
                      {current && <span className={styles.footerBadge}>здесь</span>}
                    </span>
                    <span className={styles.footerAppDesc}>{app.description}</span>
                  </span>
                </a>
              )
            })}
          </div>
          <div className={styles.footerCopy}>© {new Date().getFullYear()} PW Hub</div>
        </div>
      </footer>
    </div>
  )
}
