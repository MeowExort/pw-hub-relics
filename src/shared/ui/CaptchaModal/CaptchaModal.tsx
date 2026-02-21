/**
 * Модальное окно CAPTCHA (hCaptcha).
 * Показывается автоматически, когда сервер требует прохождение CAPTCHA.
 * Подписывается на состояние captcha-модуля и рендерит виджет hCaptcha.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  onCaptchaRequired,
  isCaptchaRequired,
  solveCaptcha,
  cancelCaptcha,
  getHcaptchaSiteKey,
} from '@/shared/security/captcha'
import styles from './CaptchaModal.module.scss'

/** Глобальный тип hCaptcha (загружается через <script>) */
declare global {
  interface Window {
    hcaptcha?: {
      render: (container: HTMLElement, options: {
        sitekey: string
        callback: (token: string) => void
        'error-callback'?: () => void
        'expired-callback'?: () => void
        theme?: 'light' | 'dark'
      }) => string
      remove: (widgetId: string) => void
    }
  }
}

/** Загружает скрипт hCaptcha, если ещё не загружен */
function loadHcaptchaScript(): Promise<void> {
  if (window.hcaptcha) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src*="hcaptcha"]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      return
    }

    const script = document.createElement('script')
    script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Не удалось загрузить hCaptcha'))
    document.head.appendChild(script)
  })
}

/**
 * Компонент модального окна CAPTCHA.
 * Автоматически появляется при требовании CAPTCHA от сервера.
 */
export function CaptchaModal() {
  const [visible, setVisible] = useState(isCaptchaRequired)
  const widgetRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  // Подписка на изменение состояния CAPTCHA
  useEffect(() => {
    return onCaptchaRequired((required) => {
      setVisible(required)
    })
  }, [])

  // Рендер виджета hCaptcha при открытии
  useEffect(() => {
    if (!visible) return

    let cancelled = false

    loadHcaptchaScript().then(() => {
      if (cancelled || !widgetRef.current || !window.hcaptcha) return

      widgetIdRef.current = window.hcaptcha.render(widgetRef.current, {
        sitekey: getHcaptchaSiteKey(),
        callback: (token: string) => {
          solveCaptcha(token)
        },
        'error-callback': () => {
          cancelCaptcha()
        },
        'expired-callback': () => {
          cancelCaptcha()
        },
        theme: 'dark',
      })
    }).catch(() => {
      // Скрипт не загрузился — отменяем CAPTCHA
      if (!cancelled) cancelCaptcha()
    })

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.hcaptcha) {
        window.hcaptcha.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [visible])

  /** Обработчик отмены */
  const handleCancel = useCallback(() => {
    cancelCaptcha()
  }, [])

  if (!visible) return null

  return createPortal(
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Проверка CAPTCHA">
      <div className={styles.container}>
        <h2 className={styles.title}>Проверка безопасности</h2>
        <p className={styles.description}>
          Пожалуйста, подтвердите, что вы не робот
        </p>
        <div className={styles.widget} ref={widgetRef} />
        <button className={styles.cancel} onClick={handleCancel} type="button">
          Отмена
        </button>
      </div>
    </div>,
    document.body,
  )
}
