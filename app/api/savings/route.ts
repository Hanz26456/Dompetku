import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json([], { status: 401 })

  const goals = await prisma.savingsGoal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(goals)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, targetAmount } = await req.json()
  const goal = await prisma.savingsGoal.create({
    data: {
      name,
      targetAmount: parseFloat(targetAmount) || 0,
      userId: session.user.id,
    },
  })
  return NextResponse.json(goal)
}

// Handle adding funds to a goal
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { goalId, walletId, amount, type } = await req.json() // type: 'add' or 'withdraw'
  const numAmount = parseFloat(amount)

  if (!goalId || !walletId || !numAmount) return NextResponse.json({ error: "Missing data" }, { status: 400 })

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Savings Goal
      const updatedGoal = await tx.savingsGoal.update({
        where: { id: goalId },
        data: {
          currentAmount: {
            [type === "add" ? "increment" : "decrement"]: numAmount,
          },
        },
      })

      // 2. Update Wallet balance
      // If adding to savings, it's an expense from wallet. If withdrawing, it's an income to wallet.
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: {
            [type === "add" ? "decrement" : "increment"]: numAmount,
          },
        },
      })

      // 3. Create Transaction record
      await tx.transaction.create({
        data: {
          amount: numAmount,
          type: type === "add" ? "expense" : "income",
          category: "Tabungan",
          note: `${type === "add" ? "Menabung untuk" : "Tarik dari"} ${updatedGoal.name}`,
          date: new Date(),
          userId: session.user.id,
          walletId: walletId,
          savingsGoalId: goalId,
        },
      })

      return updatedGoal
    })

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 })

  await prisma.savingsGoal.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
