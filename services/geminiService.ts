
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getGeminiExplanation = async (topic: string, context: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a friendly Data Science tutor. Explain the concept of "${topic}" in the context of "${context}" to a beginner. Use a simple analogy and keep it under 100 words.`,
      config: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to my brain right now. Please try again later!";
  }
};

export const createChatSession = () => {
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: 'You are "DataAI", a world-class Data Science and Machine Learning tutor for the "DataExplaining" platform. Your goal is to help users understand complex concepts like Linear Regression, Overfitting, Neural Networks, and Reinforcement Learning using simple language and intuitive analogies. Be concise, encouraging, and clear. If a user asks about a specific lesson on our platform, provide extra insight into why that concept matters in real-world applications.',
    },
  });
};
