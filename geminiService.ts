
import { GoogleGenAI, Type } from "@google/genai";
import { ANALYSIS_SYSTEM_PROMPT } from "./constants.tsx";
import { AnalysisResult, ImageSize } from "./types";

export const getClarityAnalysis = async (
  text: string,
  images: string[],
  newsContext: string
): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const contents: any[] = [{ text: `Founder Input: ${text}\n\nContextual News: ${newsContext}` }];
  
  images.forEach(img => {
    contents.push({
      inlineData: {
        mimeType: 'image/png',
        data: img.split(',')[1]
      }
    });
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: contents },
    config: {
      systemInstruction: ANALYSIS_SYSTEM_PROMPT,
      responseMimeType: 'application/json',
    },
  });

  return JSON.parse(response.text || '{}') as AnalysisResult;
};

export const generateVisualConcept = async (
  prompt: string,
  size: ImageSize
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [
        { text: `High-fidelity professional startup visual/diagram/concept for: ${prompt}. Professional, clean, boardroom presentation quality.` }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: size
      }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("Failed to generate image.");
};
