import { Outlet, NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { isAuthenticated } from '@/shared/api/auth'
import { UserMenu } from '@/shared/ui/UserMenu'
import styles from './MainLayout.module.scss'

/** Основной лейаут приложения: хедер, навигация, контент */
export function MainLayout() {
  const authenticated = isAuthenticated()

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <NavLink to="/" className={styles.logo}>
            PW Hub — Реликвии
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
                to="/analytics"
                className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}
              >
                Аналитика
              </NavLink>
              <NavLink
                to="/guides"
                className={({ isActive }) => clsx(styles.navLink, isActive && styles.active)}
              >
                Гайды
              </NavLink>
            </nav>
          )}
          {authenticated && <UserMenu />}
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
