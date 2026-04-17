// Browser-compatible storage module
export const storage = {
  prefix: 'dental_ta_',

  getKey(key) {
    return `${this.prefix}${key}`;
  },

  get(key, defaultValue) {
    if (typeof window === 'undefined') return defaultValue || null;
    
    const item = localStorage.getItem(this.getKey(key));
    if (!item) return defaultValue || null;
    
    try {
      return JSON.parse(item);
    } catch {
      return defaultValue || null;
    }
  },

  set(key, value) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.getKey(key), JSON.stringify(value));
  },

  remove(key) {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.getKey(key));
  },

  clear() {
    if (typeof window === 'undefined') return;
    
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  },

  // App-specific methods
  getSettings() {
    return this.get('settings', {
      first_run: true,
      dev_mode: false,
      numbering: 'universal',
      image_preference: 'mfh',
      auto_page_teeth: true,
      language: 'en-US'
    });
  },

  setSettings(settings) {
    const current = this.getSettings();
    this.set('settings', { ...current, ...settings });
  },

  getAppData() {
    const settings = this.getSettings();
    const uid = this.get('uid') || window.shortid.generate();
    
    if (!this.get('uid')) {
      this.set('uid', uid);
    }

    return {
      name: 'Subadult Dental Age Estimation',
      version: '0.1.7',
      uid,
      settings
    };
  },

  // Case data methods
  getCurrentCase() {
    return this.get('current_case');
  },

  setCurrentCase(caseData) {
    this.set('current_case', caseData);
  },

  clearCurrentCase() {
    this.remove('current_case');
  }
};