import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/shared/theme'
import { logout } from '@/shared/api/auth'
import styles from './UserMenu.module.scss'

/**
 * Меню пользователя в хедере.
 * Содержит: аватар/иконку, dropdown с переключением темы и кнопкой выхода.
 */
export function UserMenu() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { theme, toggleTheme } = useTheme()

  /** Закрытие меню при клике вне */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  /** Обработчик выхода */
  const handleLogout = () => {
    setOpen(false)
    logout()
  }

  /** Обработчик переключения темы */
  const handleToggleTheme = () => {
    toggleTheme()
  }

  return (
    <div className={styles.userMenu} ref={menuRef}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Меню пользователя"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className={styles.avatar}>👤</span>
      </button>

      {open && (
        <div className={styles.dropdown} role="menu">
          <button
            className={styles.menuItem}
            onClick={handleToggleTheme}
            role="menuitem"
          >
            <span className={styles.menuIcon}>{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>
          </button>
          <div className={styles.divider} />
          <button
            className={styles.menuItem}
            onClick={handleLogout}
            role="menuitem"
          >
            <span className={styles.menuIcon}>🚪</span>
            <span>Выйти</span>
          </button>
        </div>
      )}
    </div>
  )
}
