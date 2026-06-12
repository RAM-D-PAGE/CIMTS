import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Menu, Sun, Moon, Globe } from 'lucide-react';
import { useThemeStore } from '../../stores/useThemeStore';
import { useSidebarStore } from '../../stores/useSidebarStore';
import { useDataStore } from '../../stores/useDataStore';
import styles from './Header.module.css';

const routeTitles: Record<string, string> = {
  '/': 'nav.dashboard',
  '/notes': 'notes.title',
  '/media': 'media.title',
  '/calendar': 'calendar.title',
  '/time-tracker': 'timeTracker.title',
  '/settings': 'settings.title',
};

export default function Header() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const { setMobileOpen } = useSidebarStore();
  const profile = useDataStore((s) => s.profile);

  const titleKey = Object.entries(routeTitles).find(([path]) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  )?.[1] || 'nav.dashboard';

  const toggleLanguage = () => {
    const newLang = i18n.language === 'th' ? 'en' : 'th';
    i18n.changeLanguage(newLang);
    localStorage.setItem('cimts-language', newLang);
  };

  const getInitials = () => {
    if (!profile.name) return '?';
    return profile.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <button className={styles.menuBtn} onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>
        <h1 className={styles.pageTitle}>{t(titleKey)}</h1>
      </div>

      <div className={styles.headerRight}>
        <button className={styles.langBtn} onClick={toggleLanguage} title="Switch language">
          <Globe size={14} />
          {i18n.language === 'th' ? 'TH' : 'EN'}
        </button>

        <button className={styles.iconBtn} onClick={toggleTheme} title="Toggle theme">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div className={styles.avatar} title={profile.name || 'Profile'}>
          {getInitials()}
        </div>
      </div>
    </header>
  );
}
