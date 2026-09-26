import { GoogleGenAI, Type, Schema } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const DEFAULT_MODEL = 'gemini-3.5-flash-lite';

export async function generateChatResponse(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
  message: string
) {
  const contents = history.map(msg => ({
    role: msg.role === 'model' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));
  
  contents.push({ role: 'user', parts: [{ text: message }] });

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    return {
      text: response.text || "I'm sorry, I couldn't generate a response.",
      usage: response.usageMetadata
    };
  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
}

export async function generateItinerary(
  systemPrompt: string
) {
  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      summary: { type: Type.STRING },
      days: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            day: { type: Type.INTEGER },
            title: { type: Type.STRING },
            activities: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["day", "title", "activities"]
        }
      },
      note: { type: Type.STRING }
    },
    required: ["title", "summary", "days", "note"]
  };

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const aiText = response.text || "{}";
    let parsedJson;
    try {
      const jsonStr = aiText.replace(/```json\n?|```/g, "").trim();
      parsedJson = JSON.parse(jsonStr);
    } catch {
      throw new Error("Failed to parse Gemini JSON");
    }

    return {
      data: parsedJson,
      usage: response.usageMetadata
    };
  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
}
