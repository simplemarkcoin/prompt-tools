
export interface Prompt {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  createdAt: number;
}

export type ToolType = 'rephrase' | 'improve' | 'tone' | 'summarize' | 'expand';

export interface ToolConfig {
  name: string;
  description: string;
  icon: string;
  systemPrompt: string;
  userPromptTemplate: (input: string, context?: string) => string;
}

export interface AppSettings {
  model: string;
  isConfigured: boolean;
  customInstructions?: Record<ToolType, string>;
}

export enum StorageKeys {
  PROMPTS = 'pv_prompts',
  SETTINGS = 'pv_settings'
}
