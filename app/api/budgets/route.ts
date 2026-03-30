import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get("month")

  const budgets = await prisma.budget.findMany({
    where: {
      userId: session.user.id,
      ...(month && { month })
    },
  })

  return NextResponse.json(budgets)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { category, amount, month } = body

  if (!category || amount === undefined || !month) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // Use upsert so user can just keep replacing the budget for the same month/category
  const budget = await prisma.budget.upsert({
    where: {
      userId_category_month: {
        userId: session.user.id,
        category,
        month,
      }
    },
    update: {
      amount: parseFloat(amount),
    },
    create: {
      userId: session.user.id,
      category,
      amount: parseFloat(amount),
      month,
    }
  })

  return NextResponse.json(budget)
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 })

  await prisma.budget.delete({ where: { id } })
  
  return NextResponse.json({ success: true })
}
