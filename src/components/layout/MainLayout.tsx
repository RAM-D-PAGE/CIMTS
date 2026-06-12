import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSidebarStore } from '../../stores/useSidebarStore';
import styles from './MainLayout.module.css';

export default function MainLayout() {
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={`${styles.mainArea} ${isCollapsed ? styles.collapsed : ''}`}>
        <Header />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
