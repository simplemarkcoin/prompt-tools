
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
    // isConfigured is true by default because API_KEY is managed externally via process.env
    return data ? JSON.parse(data) : { model: 'gemini-3-flash-preview', isConfigured: true };
  },

  saveSettings: (settings: AppSettings): void => {
    localStorage.setItem(StorageKeys.SETTINGS, JSON.stringify(settings));
  }
};
