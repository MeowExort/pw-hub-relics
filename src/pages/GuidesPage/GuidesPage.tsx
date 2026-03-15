import { useSearchParams } from 'react-router-dom';
import { Tabs, TabOption } from '@/shared/ui';
import { SharpeningGuide } from './components/SharpeningGuide/SharpeningGuide';
import { QuestsGuide } from './components/QuestsGuide/QuestsGuide';
import styles from './GuidesPage.module.scss';

type GuideTab = 'sharpening' | 'quests';

const TABS: TabOption<GuideTab>[] = [
  { id: 'sharpening', label: 'Заточка реликвий' },
  { id: 'quests', label: 'Квесты и награды' },
];

/**
 * Страница справочной информации (Гайды).
 * Модуль 4: Справочные страницы.
 */
export function GuidesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as GuideTab | null;
  const activeTab: GuideTab = tabParam && TABS.some(t => t.id === tabParam) ? tabParam : 'sharpening';

  const handleTabChange = (tab: GuideTab) => {
    setSearchParams({ tab }, { replace: true });
  };

  return (
    <div className={styles.container}>

      <div className={styles.content}>
        <Tabs
          tabs={TABS}
          activeTabId={activeTab}
          onChange={handleTabChange}
          className={styles.tabs}
        />

        <main className={styles.main}>
          {activeTab === 'sharpening' && <SharpeningGuide />}
          {activeTab === 'quests' && <QuestsGuide />}
        </main>
      </div>
    </div>
  );
}
