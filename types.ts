
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

export type Theme = 'light' | 'dark';

export type AIProvider = 'gemini' | 'openai' | 'groq' | 'openrouter';

export interface AppSettings {
  model: string;
  provider: AIProvider;
  isConfigured: boolean;
  theme: Theme;
  customInstructions?: Record<ToolType, string>;
  hasKeySelected: boolean;
  useProxy: boolean;
  proxyUrl?: string;
  apiKeys: {
    gemini?: string;
    openai?: string;
    groq?: string;
    openrouter?: string;
  };
}

export enum StorageKeys {
  PROMPTS = 'pv_prompts',
  SETTINGS = 'pv_settings'
}
