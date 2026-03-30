import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { GoogleGenAI } from "@google/genai"
import { CATEGORIES_EXPENSE } from "@/lib/types"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { base64Image, mimeType } = await req.json()
    if (!base64Image || !mimeType) {
      return NextResponse.json({ error: "Missing image data" }, { status: 400 })
    }

    // --- Save image to public/uploads ---
    let savedImageUrl = null
    try {
      const { v4: uuidv4 } = require("uuid")
      const { writeFile, mkdir } = require("fs/promises")
      const { join } = require("path")
      
      const buffer = Buffer.from(base64Image, "base64")
      const uploadDir = join(process.cwd(), "public", "uploads")
      await mkdir(uploadDir, { recursive: true })
      
      const fileExtension = mimeType.split("/").pop() || "jpg"
      const fileName = `scan-${uuidv4()}.${fileExtension}`
      const path = join(uploadDir, fileName)
      
      await writeFile(path, buffer)
      savedImageUrl = `/uploads/${fileName}`
    } catch (e) {
      console.error("Failed to save scan image:", e)
    }
    // --- End Save image ---

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API Key is missing in server configuration" }, { status: 500 })
    }

    // Initialize Gemini API
    const ai = new GoogleGenAI({ apiKey })
    
    // Explicit, deterministic prompt emphasizing strict JSON
    const prompt = `Anda adalah asisten pencatat keuangan. Anda harus membaca struk belanja yang dikirimkan.
Tugas Anda: Ekstrak total pembelanjaan, nama toko, dan kategori.
DAFTAR KATEGORI YANG DIIZINKAN (harus pilih satu): ${CATEGORIES_EXPENSE.join(", ")}

KEMBALIKAN RAW JSON OBJECT, tanpa pembungkus markdown (\`\`\`json) dan tanpa teks tambahan!
Contoh response sukses:
{
  "amount": 250000,
  "note": "Supermarket Indomaret",
  "category": "Belanja"
}
`

    // Generate content using gemini-2.5-flash
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            prompt,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType
                }
            }
        ]
    })

    const textResult = response.text || ""
    // Cleanup markdown backticks if AI accidentally included them despite prompt
    const cleanJsonString = textResult.replace(/```json/ig, "").replace(/```/g, "").trim()
    
    const resultJson = JSON.parse(cleanJsonString)
    resultJson.receiptUrl = savedImageUrl

    // Fallback amount logic if AI returned string
    if (typeof resultJson.amount === "string") {
      resultJson.amount = parseInt(resultJson.amount.replace(/\D/g, ""))
    }

    return NextResponse.json(resultJson)
  } catch (error: any) {
    console.error("Scan Receipt Error:", error)
    return NextResponse.json({ error: "Gagal membaca struk: " + error.message }, { status: 500 })
  }
}
