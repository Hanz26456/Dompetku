import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { amount, debtId, walletId, date } = body

  if (!amount || !debtId || !walletId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get the debt to know its type and current balance
      const debt = await (tx.debt as any).findUnique({
        where: { id: debtId },
        include: { payments: true }
      })

      if (!debt) throw new Error("Debt not found")

      // 2. Create the Transaction
      const transaction = await tx.transaction.create({
        data: {
          amount: parseFloat(amount),
          type: debt.type === "owe" ? "expense" : "income",
          category: "Hutang",
          note: `Cicilan: ${debt.name}`,
          date: new Date(date || Date.now()),
          userId: session.user.id,
          walletId: walletId,
        }
      })

      // 3. Create the DebtPayment
      const payment = await (tx as any).debtPayment.create({
        data: {
          amount: parseFloat(amount),
          debtId: debtId,
          walletId: walletId,
          transactionId: transaction.id,
          date: new Date(date || Date.now()),
        }
      })

      // 4. Update Wallet balance
      await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: {
            increment: debt.type === "owe" ? -parseFloat(amount) : parseFloat(amount)
          }
        }
      })

      // 5. Check if debt is now fully paid
      const totalPaid = (debt as any).payments.reduce((sum: number, p: any) => sum + p.amount, 0) + parseFloat(amount)
      if (totalPaid >= debt.amount) {
        await tx.debt.update({
          where: { id: debtId },
          data: { isPaid: true }
        })
      }

      return payment
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Debt Payment Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
