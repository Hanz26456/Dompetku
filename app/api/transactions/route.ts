import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
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
  const transaction = await prisma.transaction.create({
    data: {
      amount: parseFloat(body.amount),
      type: body.type,
      category: body.category,
      note: body.note ?? "",
      date: new Date(body.date),
      userId: session.user.id,
    },
  })
  
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
  
  await prisma.transaction.delete({ where: { id } })
  
  // Fire and forget sheets sync
  deleteTransactionRow(id).catch(console.error)
  
  return NextResponse.json({ success: true })
}