import React from 'react';
import styles from './Tabs.module.scss';
import classNames from 'clsx';

/**
 * Описание вкладки (таба).
 */
export interface TabOption<T extends string = string> {
  /** Идентификатор вкладки */
  id: T;
  /** Текстовое название вкладки */
  label: string;
  /** Иконка (опционально) */
  icon?: React.ReactNode;
}

/**
 * Пропсы компонента Tabs.
 */
interface TabsProps<T extends string = string> {
  /** Список доступных вкладок */
  tabs: TabOption<T>[];
  /** Идентификатор активной вкладки */
  activeTabId: T;
  /** Обработчик переключения вкладки */
  onChange: (tabId: T) => void;
  /** Дополнительный CSS-класс */
  className?: string;
}

/**
 * Переключатель вкладок (Tabs).
 */
export function Tabs<T extends string = string>({
  tabs,
  activeTabId,
  onChange,
  className,
}: TabsProps<T>) {
  return (
    <div className={classNames(styles.tabs, className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={classNames(styles.tab, {
            [styles.active]: tab.id === activeTabId,
          })}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {tab.icon && <span className={styles.icon}>{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
