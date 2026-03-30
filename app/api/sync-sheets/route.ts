import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { syncAllTransactions, syncAllDebts } from "@/lib/sheets"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    // 1. Get all data for the user
    // We only sync the current user's data to their sheet
    // If the spreadsheet is shared for a family, all users should use the exact same spreadsheet ID
    // or this endpoint can sync the entire DB if admin. For now, we sync the user's data.
    
    // For a family app, you might want to sync ALL data if the family shares the sheet.
    // Assuming a simple model: user syncs all their own records.
    const transactions = await prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
    })

    const debts = await prisma.debt.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    // 2. Clear and recreate sheet rows
    const txSuccess = await syncAllTransactions(transactions)
    const debtSuccess = await syncAllDebts(debts)
    
    if (!txSuccess || !debtSuccess) {
      return NextResponse.json({ 
        error: "Sync failed. Check server logs and verify your GOOGLE_SERVICE_ACCOUNT_KEY and GOOGLE_SHEETS_SPREADSHEET_ID in .env." 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Sinkronisasi berhasil" })
  } catch (error: any) {
    console.error("Sync error:", error)
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 })
  }
}
