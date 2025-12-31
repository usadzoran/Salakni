
import { GoogleGenAI } from "@google/genai";

// Initialize the GoogleGenAI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAIRecommendation = async (userNeed: string, workers: any[]) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `بناءً على طلب المستخدم: "${userNeed}"، والعمال المتاحين: ${JSON.stringify(workers)}، اقترح أفضل عامل وشرح السبب باختصار باللغة العربية.`,
      config: {
        systemInstruction: "أنت مساعد ذكي لمنصة سلكني (Salakni) في الجزائر. هدفك هو مساعدة المستخدمين في العثور على أنسب حرفي أو عامل لخدمتهم.",
        temperature: 0.7,
      },
    });

    // Access the .text property directly as per GenerateContentResponse guidelines.
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة لاحقاً.";
  }
};

export const generateBio = async (category: string, skills: string[]) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `أنا أعمل في مجال ${category} وأتقن المهارات التالية: ${skills.join(', ')}. اكتب لي سيرة ذاتية (Bio) قصيرة وجذابة للزبائن باللغة العربية.`,
    });
    // Access the .text property directly as per GenerateContentResponse guidelines.
    return response.text;
  } catch (error) {
    console.error("Gemini Bio Error:", error);
    return "";
  }
};
