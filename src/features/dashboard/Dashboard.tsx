import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  FileText,
  PenLine,
  TimerIcon,
  ListTodo,
  Upload,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useDataStore } from '../../stores/useDataStore';
import { formatDateTime, daysBetween, formatDurationString } from '../../utils/helpers';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const { profile, notes, tasks, timeEntries } = useDataStore();

  // Calculate stats
  const internDays = profile.internshipStart
    ? daysBetween(new Date(profile.internshipStart), new Date())
    : 0;

  const todayEntries = timeEntries.filter((e) => {
    const d = new Date(e.clockIn);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const todayMs = todayEntries.reduce((sum, e) => {
    const end = e.clockOut ? new Date(e.clockOut).getTime() : Date.now();
    return sum + (end - new Date(e.clockIn).getTime());
  }, 0);

  const totalMs = timeEntries.reduce((sum, e) => {
    const end = e.clockOut ? new Date(e.clockOut).getTime() : Date.now();
    return sum + (end - new Date(e.clockIn).getTime());
  }, 0);

  const completedTasks = tasks.filter((t) => t.status === 'done').length;

  // Weekly hours chart data
  const weekDays = i18n.language === 'th'
    ? ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const chartData = weekDays.map((name, i) => {
    const now = new Date();
    const dayOffset = now.getDay() - i;
    const dayDate = new Date(now);
    dayDate.setDate(now.getDate() - dayOffset);
    const dayStr = dayDate.toDateString();

    const hours = timeEntries
      .filter((e) => new Date(e.clockIn).toDateString() === dayStr)
      .reduce((sum, e) => {
        const end = e.clockOut ? new Date(e.clockOut).getTime() : Date.now();
        return sum + (end - new Date(e.clockIn).getTime());
      }, 0) / 3600000;

    return { name, hours: Math.round(hours * 10) / 10 };
  });

  // Recent activity (last 5 notes)
  const recentNotes = notes.slice(0, 5);

  return (
    <div className={styles.dashboard}>
      {/* Welcome Banner */}
      <div className={`${styles.welcomeBanner} animate-fade-in-up`}>
        <div className={styles.welcomeTitle}>
          {t('dashboard.welcome', { name: profile.name || 'Intern' })} 👋
        </div>
        <div className={styles.welcomeSub}>
          {t('app.tagline')}
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} animate-fade-in-up stagger-1`}>
          <div className={`${styles.statIcon} ${styles.indigo}`}>
            <CalendarDays size={20} />
          </div>
          <div className={styles.statValue}>{internDays}</div>
          <div className={styles.statLabel}>{t('dashboard.internDays')}</div>
        </div>
        <div className={`${styles.statCard} animate-fade-in-up stagger-2`}>
          <div className={`${styles.statIcon} ${styles.violet}`}>
            <TimerIcon size={20} />
          </div>
          <div className={styles.statValue}>{formatDurationString(totalMs)}</div>
          <div className={styles.statLabel}>{i18n.language === 'th' ? 'ชั่วโมงทำงานรวม' : 'Total Hours'}</div>
        </div>
        <div className={`${styles.statCard} animate-fade-in-up stagger-3`}>
          <div className={`${styles.statIcon} ${styles.green}`}>
            <Clock size={20} />
          </div>
          <div className={styles.statValue}>{formatDurationString(todayMs)}</div>
          <div className={styles.statLabel}>{t('dashboard.hoursToday')}</div>
        </div>
        <div className={`${styles.statCard} animate-fade-in-up stagger-4`}>
          <div className={`${styles.statIcon} ${styles.amber}`}>
            <CheckCircle2 size={20} />
          </div>
          <div className={styles.statValue}>{completedTasks}/{tasks.length}</div>
          <div className={styles.statLabel}>{t('dashboard.tasksCompleted')}</div>
        </div>
        <div className={`${styles.statCard} animate-fade-in-up stagger-5`}>
          <div className={`${styles.statIcon} ${styles.indigo}`}>
            <FileText size={20} />
          </div>
          <div className={styles.statValue}>{notes.length}</div>
          <div className={styles.statLabel}>{t('dashboard.totalNotes')}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className={styles.sectionTitle}>{t('dashboard.quickActions')}</div>
        <div className={styles.quickActions}>
          <Link to="/notes?new=1" className={styles.quickAction}>
            <div className={styles.quickActionIcon}><PenLine size={20} /></div>
            {t('dashboard.newNote')}
          </Link>
          <Link to="/time-tracker" className={styles.quickAction}>
            <div className={styles.quickActionIcon}><TimerIcon size={20} /></div>
            {t('dashboard.clockIn')}
          </Link>
          <Link to="/calendar" className={styles.quickAction}>
            <div className={styles.quickActionIcon}><ListTodo size={20} /></div>
            {t('dashboard.viewTasks')}
          </Link>
          <Link to="/media" className={styles.quickAction}>
            <div className={styles.quickActionIcon}><Upload size={20} /></div>
            {t('dashboard.uploadMedia')}
          </Link>
        </div>
      </div>

      {/* Bottom panels */}
      <div className={styles.bottomGrid}>
        {/* Recent Activity */}
        <div className={`${styles.panel} animate-fade-in-up stagger-5`}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>{t('dashboard.recentActivity')}</div>
          </div>
          {recentNotes.length === 0 ? (
            <div className={styles.emptyState}>{t('dashboard.noActivity')}</div>
          ) : (
            <div className={styles.activityList}>
              {recentNotes.map((note) => (
                <div key={note.id} className={styles.activityItem}>
                  <div className={styles.activityDot} />
                  <div className={styles.activityContent}>
                    <div className={styles.activityText}>{note.title}</div>
                    <div className={styles.activityTime}>
                      {formatDateTime(note.createdAt, i18n.language)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Chart */}
        <div className={`${styles.panel} animate-fade-in-up stagger-6`}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>{t('dashboard.weeklyHours')}</div>
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--border-radius-md)',
                    fontSize: '0.85rem',
                  }}
                />
                <Bar
                  dataKey="hours"
                  fill="url(#barGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
