import { GoogleGenAI } from "@google/genai"

export async function askGemini(prompt: string, context: string) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing")

  const ai = new GoogleGenAI({ apiKey })
  
  const fullPrompt = `
You are "Dompetku AI Assistant", a professional financial advisor. 
Use the following financial data of the user to answer their questions. 
Keep your answers concise, helpful, and friendly. 
Always answer in the same language as the user (default: Indonesian).

USER FINANCIAL CONTEXT:
${context}

USER QUESTION:
${prompt}
`

  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [fullPrompt]
  })

  return result.text || "Maaf, saya tidak bisa memberikan jawaban saat ini."
}
