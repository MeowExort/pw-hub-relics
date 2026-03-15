import React from 'react';
import styles from './LevelStepper.module.scss';

const ALLOWED_VALUES = [0, 4, 8, 12, 16, 20];

interface LevelStepperProps {
  /** Текущий уровень */
  value: number;
  /** Обработчик изменения */
  onChange: (value: number) => void;
  /** Подпись */
  label?: string;
  /** Минимальное значение */
  min?: number;
  /** Максимальное значение */
  max?: number;
}

/**
 * Кастомный инпут для выбора уровня заточки.
 * Поддерживает кнопки +/-, ручной ввод и "примагничивание" к значениям: 4, 8, 12, 16, 20.
 */
export function LevelStepper({ value, onChange, label, min = 0, max = 20 }: LevelStepperProps) {
  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseInt(e.target.value, 10);
    if (isNaN(newVal)) {
      onChange(0);
      return;
    }
    onChange(Math.min(max, Math.max(min, newVal)));
  };

  const stepDown = () => {
    // Ищем ближайшее меньшее значение из списка ALLOWED_VALUES или просто уменьшаем на 1
    const prevAllowed = [...ALLOWED_VALUES].reverse().find(v => v < value);
    const nextVal = prevAllowed !== undefined ? prevAllowed : Math.max(min, value - 1);
    onChange(nextVal);
  };

  const stepUp = () => {
    // Ищем ближайшее большее значение из списка ALLOWED_VALUES или просто увеличиваем на 1
    const nextAllowed = ALLOWED_VALUES.find(v => v > value);
    const nextVal = nextAllowed !== undefined ? nextAllowed : Math.min(max, value + 1);
    onChange(nextVal);
  };

  return (
    <div className={styles.container}>
      {label && <span className={styles.label}>{label}</span>}
      <div className={styles.stepper}>
        <button 
          type="button" 
          className={styles.button} 
          onClick={stepDown}
          disabled={value <= min}
          title="Уменьшить"
        >
          −
        </button>
        <input
          type="number"
          className={styles.input}
          value={value}
          onChange={handleManualInput}
          min={min}
          max={max}
        />
        <button 
          type="button" 
          className={styles.button} 
          onClick={stepUp}
          disabled={value >= max}
          title="Увеличить"
        >
          +
        </button>
      </div>
    </div>
  );
}
