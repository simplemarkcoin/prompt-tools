
import { Prompt, AppSettings, StorageKeys } from '../types';

export const storageService = {
  getPrompts: (): Prompt[] => {
    const data = localStorage.getItem(StorageKeys.PROMPTS);
    return data ? JSON.parse(data) : [];
  },

  savePrompts: (prompts: Prompt[]): void => {
    localStorage.setItem(StorageKeys.PROMPTS, JSON.stringify(prompts));
  },

  getSettings: (): AppSettings => {
    const data = localStorage.getItem(StorageKeys.SETTINGS);
    const defaults: AppSettings = { 
      model: 'gemini-3-flash-preview', 
      provider: 'gemini',
      isConfigured: true, 
      theme: 'light',
      hasKeySelected: false,
      useProxy: true,
      proxyUrl: 'https://super-shadow-9c13.zammiaactions.workers.dev/',
      apiKeys: {}
    };
    return data ? { ...defaults, ...JSON.parse(data) } : defaults;
  },

  saveSettings: (settings: AppSettings): void => {
    localStorage.setItem(StorageKeys.SETTINGS, JSON.stringify(settings));
    
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
};
