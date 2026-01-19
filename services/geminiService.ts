
import { GoogleGenAI, Type } from "@google/genai";
import { UserContext } from "../types";

export const getGeminiExplanation = async (topic: string, context: string, params: string[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a friendly Data Science tutor. 
      Explain the concept of "${topic}" in the context of "${context}" to a beginner. 
      Use a simple analogy and keep it under 80 words.
      
      Additionally, suggest 1-2 interactive adjustments the user can make to the simulation to better understand the concept.
      Available parameters for this simulation are: ${params.join(', ')}.
      
      Return the response in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: {
              type: Type.STRING,
              description: "The textual explanation of the concept."
            },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING, description: "A short, descriptive label for the button (e.g., 'Try High Learning Rate')." },
                  parameter: { type: Type.STRING, description: "The specific parameter key to adjust (must be from the provided list)." },
                  value: { type: Type.NUMBER, description: "The numeric value to set for this parameter." }
                },
                required: ["label", "parameter", "value"]
              }
            }
          },
          required: ["explanation", "suggestions"]
        },
        temperature: 0.7,
      }
    });
    
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      explanation: "I'm having trouble connecting to my brain right now. Please try again later!",
      suggestions: []
    };
  }
};

export const generateModelDescription = async (modelName: string, userContext?: UserContext | null) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    let prompt = `Describe the future real-world application of ${modelName}. 
    Explain how this mathematical concept (like ${modelName}) solves a grand human problem in a futuristic setting. 
    Provide at least 2 real application and suggest 1 job that applied it, under 100 words.`;

    if (userContext) {
      prompt += `\n\nTAILOR THIS DESCRIPTION FOR THE FOLLOWING USER PROFILE:
      Role: ${userContext.role}
      Industry: ${userContext.industry}
      Skill Level: ${userContext.skillLevel}
      Goals: ${userContext.goals}
      Constraints: ${userContext.constraints}
      Ensure the terminology and scenarios resonate with this specific industry and role.`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Description generation error:", error);
    return "The prophecy remains obscured by the sands of time. However, the logic remains eternal.";
  }
};

export const generateModelImage = async (modelName: string, size: '1K' | '2K' | '4K', userContext?: UserContext | null) => {
  const imageAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let prompt = `Visualize the future insight of the application in real world of ${modelName} in roman arts in landscape size`;
  
  if (userContext) {
    prompt += `. Context: Futuristic ${userContext.industry} setting involving a ${userContext.role}. Style: Epic Roman aesthetic mixed with future technology.`;
  }

  try {
    const response = await imageAi.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: size
        }
      }
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("No candidate in response");

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response");
  } catch (error: any) {
    console.error("Image Generation Error:", error);
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("API_KEY_ERROR");
    }
    throw error;
  }
};

export const getRecommendedModel = async (lessons: string[], userContext: UserContext) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Given the following available machine learning lessons: ${lessons.join(', ')}.
      And the following user profile:
      Role: ${userContext.role}
      Industry: ${userContext.industry}
      Skill Level: ${userContext.skillLevel}
      Goals: ${userContext.goals}
      
      Suggest the ONE best lesson for this user to start with. 
      Briefly explain why in under 40 words.
      Return the response in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lessonId: { type: Type.STRING, description: "The ID of the suggested lesson (must match one from the list)." },
            reason: { type: Type.STRING, description: "A brief explanation of why this fits the user." }
          },
          required: ["lessonId", "reason"]
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Recommendation error:", error);
    return null;
  }
};

export const createChatSession = () => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: 'You are "DataAI", a world-class Data Science and Machine Learning tutor for the "DataExplaining" platform. Your goal is to help users understand complex concepts like Linear Regression, Overfitting, Neural Networks, and Reinforcement Learning using simple language and intuitive analogies. Be concise, encouraging, and clear.',
    },
  });
};
