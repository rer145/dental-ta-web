// Browser-compatible i18n module
let translations = {};
let currentLang = 'en-US';

const i18n = {
  language: currentLang,
  
  async init() {
    await this.loadTranslations('en-US');
    await this.loadTranslations('es');
  },
  
  async loadTranslations(lang) {
    try {
      const response = await fetch(`/locales/${lang}.json`);
      const data = await response.json();
      translations[lang] = data;
    } catch (error) {
      console.error(`Failed to load ${lang} translations:`, error);
    }
  },
  
  t(key, params) {
    const keys = key.split('.');
    let value = translations[this.language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    if (!value) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    
    // Simple parameter replacement
    if (params) {
      Object.keys(params).forEach(param => {
        value = value.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
      });
    }
    
    return value;
  },
  
  async changeLanguage(lang) {
    if (!translations[lang]) {
      await this.loadTranslations(lang);
    }
    this.language = lang;
    currentLang = lang;
  }
};

// Initialize on load
i18n.init();

export default i18n;