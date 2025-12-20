
import { GoogleGenAI, Type } from "@google/genai";
import { storageService } from "./storageService";
import { ToolType } from "../types";

export const geminiService = {
  generate: async (toolType: ToolType, defaultInstruction: string, prompt: string): Promise<string[]> => {
    const settings = storageService.getSettings();
    
    if (!process.env.API_KEY) {
      throw new Error("API_KEY not found in environment.");
    }

    // Use custom instruction if set by user in Settings, otherwise fallback to tool default
    const systemInstruction = settings.customInstructions?.[toolType] || defaultInstruction;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: settings.model || 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
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
      } catch (e) {
        return [text];
      }
    } catch (error: any) {
      console.error("Gemini AI Error:", error);
      throw new Error(error.message || "Failed to generate content");
    }
  },

  testConnection: async (model: string) => {
    if (!process.env.API_KEY) return false;
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: model,
        contents: "Respond with 'Connected' if the API key is working.",
        config: {
          maxOutputTokens: 10,
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      return response.text?.includes("Connected") ?? false;
    } catch (error) {
      return false;
    }
  }
};
