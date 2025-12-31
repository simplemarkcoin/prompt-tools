
import { storageService } from "./storageService";
import { ToolType, AIProvider } from "../types";

export const aiService = {
  generate: async (toolType: ToolType, systemInstruction: string, prompt: string): Promise<string[]> => {
    const settings = storageService.getSettings();
    const provider = settings.provider || 'gemini';

    // If we're using the proxy (Gemini only for now)
    if (provider === 'gemini' && settings.useProxy && settings.proxyUrl) {
      const combinedPrompt = `SYSTEM INSTRUCTION: ${systemInstruction}\n\nUSER INPUT: ${prompt}\n\nIMPORTANT: Respond ONLY with a valid JSON array of strings.`;
      return aiService.generateViaProxy(settings.proxyUrl, combinedPrompt);
    }

    if (provider === 'gemini') {
      return aiService.generateGemini(settings.model, systemInstruction, prompt);
    }

    return aiService.generateOpenAICompatible(provider, settings.model, systemInstruction, prompt);
  },

  generateViaProxy: async (proxyUrl: string, combinedPrompt: string): Promise<string[]> => {
    const cleanUrl = proxyUrl.trim().split('?')[0];
    
    try {
      const response = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer zam' // Required by user's Worker
        },
        body: JSON.stringify({ prompt: combinedPrompt })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Worker Error (${response.status}): ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                   data.text || 
                   data.response || 
                   data.output;
      
      if (!text) throw new Error("Worker returned no content. Check Worker console logs.");

      const cleanedText = text.replace(/```json|```/g, '').trim();
      try {
        const parsed = JSON.parse(cleanedText);
        return Array.isArray(parsed) ? parsed : [cleanedText];
      } catch {
        return [text];
      }
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
        throw new Error("CORS/NETWORK ERROR: Your Worker is blocking localhost. Ensure your 'OPTIONS' response includes 'Authorization' in 'Access-Control-Allow-Headers'.");
      }
      throw new Error(`Proxy Link Failed: ${err.message}`);
    }
  },

  generateGemini: async (model: string, system: string, prompt: string): Promise<string[]> => {
    const settings = storageService.getSettings();
    const apiKey = settings.apiKeys.gemini || process.env.API_KEY;

    if (!apiKey) throw new Error("Gemini API Key not found. Please configure it in Settings.");

    const modelName = model.startsWith('models/') ? model : `models/${model}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;

    const payload = {
      system_instruction: { 
        parts: [{ text: system }] 
      },
      contents: [
        { 
          parts: [{ text: prompt }] 
        }
      ],
      generationConfig: {
        temperature: 0.7,
        response_mime_type: "application/json",
        response_schema: {
          type: "ARRAY",
          items: { type: "STRING" }
        }
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || `Gemini API Error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) return [];
      try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : [text];
      } catch {
        return [text];
      }
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate content with Gemini");
    }
  },

  generateOpenAICompatible: async (provider: AIProvider, model: string, system: string, prompt: string): Promise<string[]> => {
    const settings = storageService.getSettings();
    let apiKey = '';
    let url = '';

    switch (provider) {
      case 'openai': apiKey = settings.apiKeys.openai || ''; url = 'https://api.openai.com/v1/chat/completions'; break;
      case 'groq': apiKey = settings.apiKeys.groq || ''; url = 'https://api.groq.com/openai/v1/chat/completions'; break;
      case 'openrouter': apiKey = settings.apiKeys.openrouter || ''; url = 'https://openrouter.ai/api/v1/chat/completions'; break;
    }

    if (!apiKey) throw new Error(`API key for ${provider.toUpperCase()} not found.`);

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
      throw new Error(err.error?.message || `Provider Fail: ${response.status}`);
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
        const apiKey = keyToTest || process.env.API_KEY;
        if (!apiKey) return false;
        
        const modelName = model.startsWith('models/') ? model : `models/${model || 'gemini-3-flash-preview'}`;
        const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "ping" }] }],
            generationConfig: { max_output_tokens: 5 }
          })
        });
        return response.ok;
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
