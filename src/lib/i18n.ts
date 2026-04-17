import i18next from 'i18next';
import enUS from '../locales/en-US.json';
import es from '../locales/es.json';

export const defaultLang = 'en-US';
export const supportedLangs = ['en-US', 'es'] as const;
export type SupportedLang = typeof supportedLangs[number];

// Initialize i18next
await i18next.init({
  lng: defaultLang,
  fallbackLng: defaultLang,
  resources: {
    'en-US': {
      translation: enUS
    },
    'es': {
      translation: es
    }
  },
  interpolation: {
    escapeValue: false // React already escapes values
  }
});

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (supportedLangs.includes(lang as SupportedLang)) {
    return lang as SupportedLang;
  }
  return defaultLang;
}

export function useTranslations(lang: SupportedLang) {
  return function t(key: string, params?: any) {
    return i18next.t(key, { lng: lang, ...params });
  };
}

export function changeLang(lang: SupportedLang) {
  i18next.changeLanguage(lang);
}

export default i18next;