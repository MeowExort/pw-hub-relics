import styles from './SharpeningGuide.module.scss';
import { Calculator } from './components/Calculator/Calculator';

/**
 * Гайд по заточке реликвий.
 * Модуль 4.1.
 */
export function SharpeningGuide() {
  return (
    <div className={styles.guide}>
      <section className={styles.section} id="calc">
        <h2 className={styles.sectionTitle}>Калькулятор стоимости заточки</h2>
        <Calculator />
      </section>
    </div>
  );
}
