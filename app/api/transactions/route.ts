import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { appendTransaction, deleteTransactionRow } from "@/lib/sheets"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
  })
  return NextResponse.json(transactions)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const amount = parseFloat(body.amount)
  
  // Find wallet (default to first wallet if not provided)
  let walletId = body.walletId
  if (!walletId) {
    const firstWallet = await prisma.wallet.findFirst({ where: { userId: session.user.id } })
    walletId = firstWallet?.id
  }

  const transaction = await prisma.transaction.create({
    data: {
      amount,
      type: body.type,
      category: body.category,
      note: body.note ?? "",
      date: new Date(body.date),
      userId: session.user.id,
      walletId: walletId,
      receiptUrl: body.receiptUrl,
    } as any,
  })

  // Update Wallet Balance
  if (walletId) {
    const isExpense = body.type === "expense"
    await prisma.wallet.update({
      where: { id: walletId },
      data: {
        balance: {
          [isExpense ? "decrement" : "increment"]: amount
        }
      }
    })
  }
  
  // Fire and forget sheets sync
  appendTransaction(transaction).catch(console.error)
  
  return NextResponse.json(transaction)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 })
  
  // Get transaction before delete to reverse balance
  const tx = await prisma.transaction.findUnique({ where: { id } })
  if (tx && tx.walletId) {
    const isExpense = tx.type === "expense"
    await prisma.wallet.update({
      where: { id: tx.walletId },
      data: {
        balance: {
          [isExpense ? "increment" : "decrement"]: tx.amount
        }
      }
    })
  }

  await prisma.transaction.delete({ where: { id } })
  
  // Fire and forget sheets sync
  deleteTransactionRow(id).catch(console.error)
  
  return NextResponse.json({ success: true })
}