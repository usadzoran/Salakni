
import { GoogleGenAI } from "@google/genai";

export const getAIRecommendation = async (userNeed: string, workers: any[]) => {
  try {
    const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
    if (!apiKey) return "نظام الذكاء الاصطناعي غير متوفر حالياً.";

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `بناءً على طلب المستخدم: "${userNeed}"، والعمال المتاحين: ${JSON.stringify(workers)}، اقترح أفضل عامل وشرح السبب باختصار باللغة العربية.`,
      config: {
        systemInstruction: "أنت مساعد ذكي لمنصة سلكني (Salakni) في الجزائر. هدفك هو مساعدة المستخدمين في العثور على أنسب حرفي أو عامل لخدمتهم.",
        temperature: 0.7,
      },
    });

    return response.text || "لم أتمكن من إيجاد توصية محددة حالياً.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "عذراً، حدث خطأ أثناء معالجة طلبك بالذكاء الاصطناعي.";
  }
};

export const generateBio = async (category: string, skills: string[]) => {
  try {
    const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
    if (!apiKey) return "";

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `أنا أعمل في مجال ${category} وأتقن المهارات التالية: ${skills.join(', ')}. اكتب لي سيرة ذاتية (Bio) قصيرة وجذابة للزبائن باللغة العربية.`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Bio Error:", error);
    return "";
  }
};
