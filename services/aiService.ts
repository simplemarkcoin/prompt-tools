
import { GoogleGenAI, Type } from "@google/genai";
import { storageService } from "./storageService";
import { ToolType, AIProvider } from "../types";

export const aiService = {
  generate: async (toolType: ToolType, defaultInstruction: string, prompt: string): Promise<string[]> => {
    const settings = storageService.getSettings();
    const systemInstruction = settings.customInstructions?.[toolType] || defaultInstruction;
    const provider = settings.provider || 'gemini';

    if (provider === 'gemini') {
      if (settings.useProxy && settings.proxyUrl) {
        // Combined prompt structure for simple workers
        const combinedPrompt = `[SYSTEM INSTRUCTION]\n${systemInstruction}\n\n[USER INPUT]\n${prompt}\n\nIMPORTANT: Respond ONLY with a valid JSON array of strings. No markdown formatting.`;
        return aiService.generateViaProxy(settings.proxyUrl, combinedPrompt);
      }
      return aiService.generateGemini(settings.model, systemInstruction, prompt);
    } else {
      return aiService.generateOpenAICompatible(provider, settings.model, systemInstruction, prompt);
    }
  },

  generateViaProxy: async (proxyUrl: string, combinedPrompt: string): Promise<string[]> => {
    // Clean URL: Remove whitespace and any accidental query strings (e.g. ?Content-Type=...)
    const cleanUrl = proxyUrl.trim().replace(/\?.*$/, '');
    
    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json' // Explicitly set header as requested
      },
      body: JSON.stringify({ prompt: combinedPrompt })
    });

    if (!response.ok) {
      throw new Error(`Proxy Node Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Parse Gemini response structure from worker
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                 data.candidates?.[0]?.text ||
                 data.text || 
                 data.response;
    
    if (!text) throw new Error("Null response from inference engine.");

    try {
      // Clean potential markdown and parse
      const cleanedText = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanedText);
      return Array.isArray(parsed) ? parsed : [cleanedText];
    } catch {
      return [text];
    }
  },

  generateGemini: async (model: string, system: string, prompt: string): Promise<string[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("Inbound Key missing. Select project in Settings.");

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: system,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      },
    });

    const text = response.text;
    if (!text) return [];
    try {
      const parsed = JSON.parse(text);
      return Array.isArray(parsed) ? parsed : [text];
    } catch {
      return [text];
    }
  },

  generateOpenAICompatible: async (provider: AIProvider, model: string, system: string, prompt: string): Promise<string[]> => {
    const settings = storageService.getSettings();
    let apiKey = '';
    let url = '';

    switch (provider) {
      case 'openai':
        apiKey = settings.apiKeys.openai || '';
        url = 'https://api.openai.com/v1/chat/completions';
        break;
      case 'groq':
        apiKey = settings.apiKeys.groq || '';
        url = 'https://api.groq.com/openai/v1/chat/completions';
        break;
      case 'openrouter':
        apiKey = settings.apiKeys.openrouter || '';
        url = 'https://openrouter.ai/api/v1/chat/completions';
        break;
    }

    if (!apiKey) throw new Error(`API Key for ${provider.toUpperCase()} not found.`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system + " Respond only with a JSON array of strings." },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `Provider Handshake Fail: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    try {
      const cleaned = content.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : [content];
    } catch {
      return [content];
    }
  },

  testConnection: async (provider: AIProvider, model: string, manualKey?: string) => {
    const settings = storageService.getSettings();
    const keyToTest = manualKey || (settings.apiKeys as any)[provider];

    try {
      if (provider === 'gemini') {
        if (settings.useProxy && settings.proxyUrl) {
          const res = await fetch(settings.proxyUrl.replace(/\?.*$/, ''), { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'ping' }) 
          });
          return res.ok;
        }
        const apiKey = process.env.API_KEY;
        if (!apiKey) return false;
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model,
          contents: "ping",
          config: { maxOutputTokens: 5, thinkingConfig: { thinkingBudget: 0 } }
        });
        return !!response.text;
      } else {
        if (!keyToTest) return false;
        const url = provider === 'openai' ? 'https://api.openai.com/v1/models' : 
                    provider === 'groq' ? 'https://api.groq.com/openai/v1/models' :
                    'https://openrouter.ai/api/v1/auth/key';
        const response = await fetch(url, { headers: { 'Authorization': `Bearer ${keyToTest}` } });
        return response.ok;
      }
    } catch {
      return false;
    }
  }
};
