import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { appendDebt, updateDebtRow, deleteDebtRow } from "@/lib/sheets"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const debts = await prisma.debt.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(debts)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const debt = await prisma.debt.create({
    data: {
      name: body.name,
      amount: parseFloat(body.amount),
      type: body.type,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      note: body.note ?? "",
      userId: session.user.id,
    },
  })
  
  appendDebt(debt).catch(console.error)
  
  return NextResponse.json(debt)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const debt = await prisma.debt.update({
    where: { id: body.id },
    data: { isPaid: body.isPaid },
  })
  
  updateDebtRow(debt).catch(console.error)
  
  return NextResponse.json(debt)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 })
  
  await prisma.debt.delete({ where: { id } })
  
  deleteDebtRow(id).catch(console.error)
  
  return NextResponse.json({ success: true })
}