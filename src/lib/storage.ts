import shortid from 'shortid';

export interface Settings {
  first_run: boolean;
  dev_mode: boolean;
  numbering: 'universal' | 'fdi' | 'palmer' | 'field';
  image_preference: 'mfh' | 'xray';
  auto_page_teeth: boolean;
  language: 'en-US' | 'es';
}

export interface AppData {
  name: string;
  version: string;
  uid: string;
  settings: Settings;
}

export interface CaseData {
  scores: Record<string, string | number>;
  properties: {
    case_number: string;
    observation_date: string;
    analyst: string;
    memo: string;
  };
}

class Storage {
  private prefix = 'dental_ta_';

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  get<T>(key: string, defaultValue?: T): T | null {
    if (typeof window === 'undefined') return defaultValue || null;
    
    const item = localStorage.getItem(this.getKey(key));
    if (!item) return defaultValue || null;
    
    try {
      return JSON.parse(item);
    } catch {
      return defaultValue || null;
    }
  }

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.getKey(key), JSON.stringify(value));
  }

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.getKey(key));
  }

  clear(): void {
    if (typeof window === 'undefined') return;
    
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // App-specific methods
  getSettings(): Settings {
    return this.get<Settings>('settings', {
      first_run: true,
      dev_mode: false,
      numbering: 'universal',
      image_preference: 'mfh',
      auto_page_teeth: true,
      language: 'en-US'
    })!;
  }

  setSettings(settings: Partial<Settings>): void {
    const current = this.getSettings();
    this.set('settings', { ...current, ...settings });
  }

  getAppData(): AppData {
    const settings = this.getSettings();
    const uid = this.get<string>('uid') || shortid.generate();
    
    if (!this.get('uid')) {
      this.set('uid', uid);
    }

    return {
      name: 'Subadult Dental Age Estimation',
      version: '0.1.7',
      uid,
      settings
    };
  }

  // Case data methods
  getCurrentCase(): CaseData | null {
    return this.get<CaseData>('current_case');
  }

  setCurrentCase(caseData: CaseData): void {
    this.set('current_case', caseData);
  }

  clearCurrentCase(): void {
    this.remove('current_case');
  }
}

export const storage = new Storage();