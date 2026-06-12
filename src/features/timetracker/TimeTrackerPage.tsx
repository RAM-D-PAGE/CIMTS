import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LogIn, LogOut } from 'lucide-react';
import { useDataStore } from '../../stores/useDataStore';
import { generateId, formatDate, formatTime, formatDurationString, getWeekStart, getMonthStart } from '../../utils/helpers';
import styles from './TimeTrackerPage.module.css';

export default function TimeTrackerPage() {
  const { t, i18n } = useTranslation();
  const { timeEntries, addTimeEntry, updateTimeEntry } = useDataStore();
  const [now, setNow] = useState(Date.now());

  // Find active entry (no clockOut)
  const activeEntry = timeEntries.find((e) => !e.clockOut);

  // Live timer update
  useEffect(() => {
    if (!activeEntry) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeEntry]);

  const elapsed = activeEntry ? now - new Date(activeEntry.clockIn).getTime() : 0;

  const formatElapsed = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleClockIn = useCallback(() => {
    addTimeEntry({
      id: generateId(),
      clockIn: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  }, [addTimeEntry]);

  const handleClockOut = useCallback(() => {
    if (activeEntry) {
      updateTimeEntry(activeEntry.id, { clockOut: new Date().toISOString() });
    }
  }, [activeEntry, updateTimeEntry]);

  // Calculate stats
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const weekStart = getWeekStart(new Date());
    const monthStart = getMonthStart(new Date());

    const calcMs = (entries: typeof timeEntries) =>
      entries.reduce((sum, e) => {
        const end = e.clockOut ? new Date(e.clockOut).getTime() : Date.now();
        return sum + (end - new Date(e.clockIn).getTime());
      }, 0);

    return {
      today: calcMs(timeEntries.filter((e) => new Date(e.clockIn).toDateString() === today)),
      week: calcMs(timeEntries.filter((e) => new Date(e.clockIn) >= weekStart)),
      month: calcMs(timeEntries.filter((e) => new Date(e.clockIn) >= monthStart)),
    };
  }, [timeEntries, now]);

  // Completed entries (has clockOut)
  const completedEntries = timeEntries.filter((e) => e.clockOut).slice(0, 20);

  return (
    <div className={styles.timeTracker}>
      {/* Clock Section */}
      <div className={`${styles.clockSection} animate-fade-in-up`}>
        <div className={styles.clockStatus}>
          <span className={`${styles.statusDot} ${activeEntry ? styles.active : styles.inactive}`} />
          {activeEntry ? t('timeTracker.working') : t('timeTracker.notWorking')}
        </div>
        <div className={styles.clockTimer}>{formatElapsed(elapsed)}</div>
        {activeEntry ? (
          <button className={`${styles.clockBtn} ${styles.clockOut}`} onClick={handleClockOut}>
            <LogOut size={28} />
            {t('timeTracker.clockOut')}
          </button>
        ) : (
          <button className={`${styles.clockBtn} ${styles.clockIn}`} onClick={handleClockIn}>
            <LogIn size={28} />
            {t('timeTracker.clockIn')}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={`${styles.statCard} animate-fade-in-up stagger-1`}>
          <div className={styles.statValue}>{formatDurationString(stats.today)}</div>
          <div className={styles.statLabel}>{t('timeTracker.todayHours')}</div>
        </div>
        <div className={`${styles.statCard} animate-fade-in-up stagger-2`}>
          <div className={styles.statValue}>{formatDurationString(stats.week)}</div>
          <div className={styles.statLabel}>{t('timeTracker.weekHours')}</div>
        </div>
        <div className={`${styles.statCard} animate-fade-in-up stagger-3`}>
          <div className={styles.statValue}>{formatDurationString(stats.month)}</div>
          <div className={styles.statLabel}>{t('timeTracker.monthHours')}</div>
        </div>
      </div>

      {/* History */}
      <div className={`${styles.historySection} animate-fade-in-up`}>
        <div className={styles.historyHeader}>{t('timeTracker.history')}</div>
        {completedEntries.length === 0 ? (
          <div className={styles.emptyHistory}>{t('timeTracker.noHistory')}</div>
        ) : (
          <table className={styles.historyTable}>
            <thead>
              <tr>
                <th>{t('timeTracker.date')}</th>
                <th>{t('timeTracker.in')}</th>
                <th>{t('timeTracker.out')}</th>
                <th>{t('timeTracker.duration')}</th>
              </tr>
            </thead>
            <tbody>
              {completedEntries.map((entry) => {
                const dur = new Date(entry.clockOut!).getTime() - new Date(entry.clockIn).getTime();
                return (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.clockIn, i18n.language)}</td>
                    <td>{formatTime(entry.clockIn, i18n.language)}</td>
                    <td>{formatTime(entry.clockOut!, i18n.language)}</td>
                    <td>
                      <span className={styles.durationBadge}>{formatDurationString(dur)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
