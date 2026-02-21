import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

/** Доступные темы */
export type Theme = 'dark' | 'light'

/** Ключ хранения темы в localStorage */
const THEME_STORAGE_KEY = 'pw-hub-theme'

/** Контекст темы */
interface ThemeContextValue {
  /** Текущая тема */
  theme: Theme
  /** Переключить тему */
  toggleTheme: () => void
  /** Установить конкретную тему */
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

/**
 * Получает сохранённую тему из localStorage или возвращает тему по умолчанию.
 */
function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage недоступен
  }
  return 'dark'
}

/** Пропсы провайдера темы */
interface ThemeProviderProps {
  /** Дочерние элементы */
  children: ReactNode
  /** Начальная тема (для тестов) */
  initialTheme?: Theme
}

/**
 * Провайдер темы приложения.
 * Сохраняет выбор в localStorage, устанавливает data-атрибут на <html>.
 */
export function ThemeProvider({ children, initialTheme }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(initialTheme ?? getStoredTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // localStorage недоступен
    }
  }, [theme])

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Хук для доступа к теме.
 * Должен использоваться внутри ThemeProvider.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme должен использоваться внутри ThemeProvider')
  }
  return context
}
