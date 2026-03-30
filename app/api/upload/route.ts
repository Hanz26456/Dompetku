import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = join(process.cwd(), "public", "uploads")
    
    // Ensure directory exists
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (e) {}

    const fileExtension = file.name.split(".").pop() || "jpg"
    const fileName = `${uuidv4()}.${fileExtension}`
    const path = join(uploadDir, fileName)

    await writeFile(path, buffer)

    return NextResponse.json({ 
      url: `/uploads/${fileName}`,
      fileName: file.name
    })
  } catch (error: any) {
    console.error("Upload Error:", error)
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
  }
}
