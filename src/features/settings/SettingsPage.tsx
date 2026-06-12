import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  Palette,
  Globe,
  Database,
  Save,
  Download,
  Upload,
  Trash2,
  Info,
} from 'lucide-react';
import { useThemeStore } from '../../stores/useThemeStore';
import { useDataStore } from '../../stores/useDataStore';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useThemeStore();
  const { profile, updateProfile, exportData, importData, clearAllData } = useDataStore();

  const [name, setName] = useState(profile.name);
  const [company, setCompany] = useState(profile.company);
  const [department, setDepartment] = useState(profile.department);
  const [position, setPosition] = useState(profile.position);
  const [startDate, setStartDate] = useState(profile.internshipStart || '');
  const [endDate, setEndDate] = useState(profile.internshipEnd || '');
  const [showToast, setShowToast] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    updateProfile({
      name,
      company,
      department,
      position,
      internshipStart: startDate || undefined,
      internshipEnd: endDate || undefined,
    });
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cimts-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const success = importData(reader.result as string);
      if (success) {
        window.location.reload();
      } else {
        alert('Invalid file format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClear = () => {
    if (confirm(t('settings.clearDataConfirm'))) {
      clearAllData();
      window.location.reload();
    }
  };

  const switchLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('cimts-language', lang);
  };

  return (
    <div className={styles.settingsPage}>
      {/* Profile */}
      <div className={`${styles.section} animate-fade-in-up`}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}><User size={18} /></div>
          <span className={styles.sectionTitle}>{t('settings.profile')}</span>
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label>{t('settings.name')}</label>
              <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>{t('settings.company')}</label>
              <input className={styles.input} value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label>{t('settings.department')}</label>
              <input className={styles.input} value={department} onChange={(e) => setDepartment(e.target.value)} />
            </div>
            <div className={styles.field}>
              <label>{t('settings.position')}</label>
              <input className={styles.input} value={position} onChange={(e) => setPosition(e.target.value)} />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.field}>
              <label>{t('settings.startDate')}</label>
              <input
                className={styles.input}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label>{t('settings.endDate')}</label>
              <input
                className={styles.input}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <button className={styles.saveBtn} onClick={handleSave}>
            <Save size={16} />
            {t('common.save')}
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div className={`${styles.section} animate-fade-in-up stagger-1`}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}><Palette size={18} /></div>
          <span className={styles.sectionTitle}>{t('settings.appearance')}</span>
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.toggleRow}>
            <div className={styles.toggleInfo}>
              <span className={styles.toggleLabel}>{t('settings.darkMode')}</span>
              <span className={styles.toggleDesc}>
                {theme === 'dark' ? t('settings.darkMode') : t('settings.lightMode')}
              </span>
            </div>
            <div
              className={`${styles.toggle} ${theme === 'dark' ? styles.active : ''}`}
              onClick={toggleTheme}
            />
          </div>
        </div>
      </div>

      {/* Language */}
      <div className={`${styles.section} animate-fade-in-up stagger-2`}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}><Globe size={18} /></div>
          <span className={styles.sectionTitle}>{t('settings.language')}</span>
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.langSelector}>
            <button
              className={`${styles.langOption} ${i18n.language === 'th' ? styles.active : ''}`}
              onClick={() => switchLanguage('th')}
            >
              🇹🇭 ภาษาไทย
            </button>
            <button
              className={`${styles.langOption} ${i18n.language === 'en' ? styles.active : ''}`}
              onClick={() => switchLanguage('en')}
            >
              🇺🇸 English
            </button>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className={`${styles.section} animate-fade-in-up stagger-3`}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}><Database size={18} /></div>
          <span className={styles.sectionTitle}>{t('settings.data')}</span>
        </div>
        <div className={styles.sectionBody}>
          <div className={styles.dataActions}>
            <button className={styles.actionBtn} onClick={handleExport}>
              <Download size={16} />
              {t('settings.exportData')}
            </button>
            <button className={styles.actionBtn} onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} />
              {t('settings.importData')}
            </button>
            <button className={styles.dangerBtn} onClick={handleClear}>
              <Trash2 size={16} />
              {t('settings.clearData')}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
        </div>
      </div>

      {/* About */}
      <div className={`${styles.section} animate-fade-in-up stagger-4`}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}><Info size={18} /></div>
          <span className={styles.sectionTitle}>{t('settings.about')}</span>
        </div>
        <div className={styles.version}>
          CIMTS — Complete Internship Management & Tracking System
          <br />
          {t('settings.version')} 1.0.0
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className={styles.toast}>{t('settings.saved')}</div>
      )}
    </div>
  );
}
