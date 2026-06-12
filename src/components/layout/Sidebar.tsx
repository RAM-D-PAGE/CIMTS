import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  FileText,
  Image,
  Calendar,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useSidebarStore } from '../../stores/useSidebarStore';
import styles from './Sidebar.module.css';

const navItems = [
  { path: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/notes', icon: FileText, labelKey: 'nav.notes' },
  { path: '/media', icon: Image, labelKey: 'nav.media' },
  { path: '/calendar', icon: Calendar, labelKey: 'nav.calendar' },
  { path: '/time-tracker', icon: Clock, labelKey: 'nav.timeTracker' },
  { path: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

export default function Sidebar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { isCollapsed, isMobileOpen, toggleCollapse, setMobileOpen } = useSidebarStore();

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {isMobileOpen && <div className={styles.mobileOverlay} onClick={closeMobile} />}
      <aside
        className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''} ${isMobileOpen ? styles.mobileOpen : ''}`}
      >
        {/* Logo */}
        <div className={styles.sidebarLogo}>
          <div className={styles.logoIcon}>
            <Zap size={20} />
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>CIMTS</span>
            <span className={styles.logoSubtitle}>Internship Tracker</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.sidebarNav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={closeMobile}
                title={t(item.labelKey)}
              >
                <Icon className={styles.navIcon} size={20} />
                <span className={styles.navLabel}>{t(item.labelKey)}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer / Collapse */}
        <div className={styles.sidebarFooter}>
          <button className={styles.collapseBtn} onClick={toggleCollapse} title="Toggle sidebar">
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {!isCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
