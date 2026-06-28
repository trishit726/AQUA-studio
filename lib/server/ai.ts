import { GoogleGenAI } from "@google/genai";

let gemini: GoogleGenAI | null = null;

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function getGeminiClient(): GoogleGenAI {
  if (gemini) return gemini;

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }

  gemini = new GoogleGenAI({ apiKey });
  return gemini;
}

export async function generateText({
  system,
  user,
  maxTokens,
  json = false,
}: {
  system: string;
  user: string;
  maxTokens: number;
  json?: boolean;
}) {
  try {
    const ai = getGeminiClient();
    const config: any = {
      systemInstruction: system,
      maxOutputTokens: maxTokens,
      temperature: 0.9,
    };
    if (json) {
      config.responseMimeType = "application/json";
    }

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: user,
      config,
    });

    return response.text ?? "";
  } catch (error) {
    console.error("Error in AI generation:", error);
    throw error;
  }
}
