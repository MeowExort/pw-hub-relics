import React from 'react';
import styles from './Badge.module.scss';
import classNames from 'clsx';

/**
 * Варианты отображения Badge.
 */
export type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'outline' | 'muted';

/**
 * Пропсы компонента Badge.
 */
interface BadgeProps {
  /** Текст или контент внутри */
  children: React.ReactNode;
  /** Цветовая схема */
  variant?: BadgeVariant;
  /** Дополнительный CSS-класс */
  className?: string;
  /** Размер бейджа */
  size?: 'sm' | 'md';
}

/**
 * Небольшой текстовый индикатор (Badge).
 */
export function Badge({
  children,
  variant = 'primary',
  className,
  size = 'md',
}: BadgeProps) {
  return (
    <span className={classNames(styles.badge, styles[variant], styles[size], className)}>
      {children}
    </span>
  );
}
