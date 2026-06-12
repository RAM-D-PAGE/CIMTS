import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import th from '../locales/th/translation.json';
import en from '../locales/en/translation.json';

const savedLanguage = localStorage.getItem('cimts-language') || 'th';

i18n.use(initReactI18next).init({
  resources: {
    th: { translation: th },
    en: { translation: en },
  },
  lng: savedLanguage,
  fallbackLng: 'th',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
