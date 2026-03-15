import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { calculateCheapestEnhancement } from '@/shared/api/relics';
import { getServers } from '@/shared/api/dictionaries';
import { Select, Spinner } from '@/shared/ui';
import { RecommendationCard } from '../RecommendationCard/RecommendationCard';
import { LevelStepper } from './components/LevelStepper/LevelStepper';
import styles from './Calculator.module.scss';

const SOUL_TYPES = [
  { value: '1', label: 'Душа Покоя' },
  { value: '2', label: 'Душа Тяньюя' },
];

/** Ключ для сохранения параметров калькулятора в localStorage */
const STORAGE_KEY = 'sharpening-calculator-params';

interface StoredParams {
  soulType: number;
  targetLevel: number;
  currentLevel: number;
  serverId?: number;
}

/** Загружает сохранённые параметры из localStorage */
function loadStoredParams(): Partial<StoredParams> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<StoredParams>;
  } catch {
    return {};
  }
}

/** Сохраняет параметры в localStorage */
function saveParams(params: StoredParams): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
  } catch {
    // localStorage недоступен — игнорируем
  }
}

/**
 * Калькулятор стоимости заточки реликвий.
 * Использует API для расчета оптимального пути.
 */
export function Calculator() {
  const stored = loadStoredParams();
  const [soulType, setSoulType] = useState(stored.soulType ?? 1);
  const [targetLevel, setTargetLevel] = useState(stored.targetLevel ?? 20);
  const [currentLevel, setCurrentLevel] = useState(stored.currentLevel ?? 0);
  const [serverId, setServerId] = useState<number | undefined>(stored.serverId);

  /** Сохраняем параметры при каждом изменении */
  useEffect(() => {
    saveParams({ soulType, targetLevel, currentLevel, serverId });
  }, [soulType, targetLevel, currentLevel, serverId]);

  const { data: servers } = useQuery({
    queryKey: ['servers'],
    queryFn: () => getServers(),
  });

  const serverOptions = servers?.map(s => ({ value: s.id.toString(), label: s.name })) || [];

  const { data: optimization, isLoading, isError } = useQuery({
    queryKey: ['cheapestEnhancement', soulType, targetLevel, currentLevel, serverId],
    queryFn: () => calculateCheapestEnhancement({
      soulType,
      targetEnhancementLevel: targetLevel,
      currentEnhancementLevel: currentLevel,
      serverId,
    }),
    enabled: targetLevel > 0 && serverId !== undefined,
    staleTime: 60000,
  });

  return (
    <div className={styles.calculator}>
      <div className={styles.inputs}>
        <div className={styles.field}>
          <Select
            label="Сервер"
            options={serverOptions}
            value={serverId?.toString() || ''}
            onChange={(val) => setServerId(val ? Number(val) : undefined)}
            placeholder="Выберите сервер"
            showEmptyOption={false}
          />
        </div>
        <div className={styles.field}>
          <Select
            label="Тип души"
            options={SOUL_TYPES}
            value={soulType.toString()}
            onChange={(val) => val && setSoulType(Number(val))}
            placeholder="Выберите тип"
            showEmptyOption={false}
          />
        </div>
        <div className={styles.field}>
          <LevelStepper
            label="Текущий уровень"
            value={currentLevel}
            onChange={setCurrentLevel}
            min={0}
            max={20}
          />
        </div>
        <div className={styles.field}>
          <LevelStepper
            label="Желаемый уровень"
            value={targetLevel}
            onChange={setTargetLevel}
            min={0}
            max={20}
          />
        </div>
      </div>

      <div className={styles.result}>
        {isLoading ? (
          <div className={styles.loader}>
            <Spinner size="sm" />
            <span>Рассчитываем оптимальный путь...</span>
          </div>
        ) : isError ? (
          <p className={styles.error}>Ошибка при расчете. Попробуйте позже.</p>
        ) : optimization ? (
          <>
            <div className={styles.metaInfo}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Целевой уровень:</span>
                <span className={styles.metaValue}>+{optimization.targetLevel}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Требуется опыта:</span>
                <span className={styles.metaValue}>{optimization.requiredExperience.toLocaleString()}</span>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Недостает опыта:</span>
                <span className={styles.metaValue}>{optimization.missingExperience.toLocaleString()}</span>
              </div>
            </div>

            <div className={styles.resultItem}>
              <span className={styles.resultLabel}>Минимальная стоимость:</span>
              <span className={styles.resultValue}>{optimization.totalCostFormatted}</span>
            </div>

            {optimization.recommendations && optimization.recommendations.length > 0 && (
              <div className={styles.recommendations}>
                <span className={styles.recommendationsLabel}>Рекомендуемые реликвии:</span>
                <div className={styles.recommendationsGrid}>
                  {optimization.recommendations.map((rec) => (
                    <RecommendationCard key={rec.relicListingId} recommendation={rec} />
                  ))}
                </div>
              </div>
            )}
            
            {optimization.steps && optimization.steps.length > 0 && (
              <div className={styles.steps}>
                <span className={styles.stepsLabel}>Алгоритм заточки:</span>
                <ul className={styles.stepsList}>
                  {optimization.steps.map((step, i) => (
                    <li key={i} className={styles.stepItem}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p className={styles.note}>Выберите сервер и желаемый уровень для расчета.</p>
        )}
        
        <p className={styles.note}>
          * Расчет произведен на основе текущих цен на реликвии.
        </p>
      </div>
    </div>
  );
}
