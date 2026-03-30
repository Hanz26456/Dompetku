import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { askGemini } from "@/lib/gemini"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { prompt } = await req.json()
  if (!prompt) return NextResponse.json({ error: "No prompt provided" }, { status: 400 })

  try {
    // 1. Gather all user context
    const [wallets, transactions, debts, savings, budgets] = await Promise.all([
      prisma.wallet.findMany({ where: { userId: session.user.id } }),
      prisma.transaction.findMany({ where: { userId: session.user.id }, orderBy: { date: 'desc' }, take: 10 }),
      prisma.debt.findMany({ where: { userId: session.user.id } }),
      prisma.savingsGoal.findMany({ where: { userId: session.user.id } }),
      prisma.budget.findMany({ where: { userId: session.user.id, month: new Date().toISOString().substring(0, 7) } })
    ])

    const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0)
    const totalDebtOwe = debts.filter(d => d.type === 'owe' && !d.isPaid).reduce((sum, d) => sum + d.amount, 0)
    const totalDebtOwed = debts.filter(d => d.type === 'owed' && !d.isPaid).reduce((sum, d) => sum + d.amount, 0)

    const context = `
Current Month: ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
User Name: ${session.user.name}
Total Balance in Wallets: Rp ${totalBalance.toLocaleString('id-ID')}
Total Active Debt (You owe): Rp ${totalDebtOwe.toLocaleString('id-ID')}
Total Active Piutang (Others owe you): Rp ${totalDebtOwed.toLocaleString('id-ID')}

Wallets: ${wallets.map(w => `${w.name}: Rp ${w.balance.toLocaleString('id-ID')}`).join(', ')}
Recent Transactions:
${transactions.map(t => `- ${t.date.toISOString().split('T')[0]}: ${t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString('id-ID')} (${t.category}: ${t.note || 'no note'})`).join('\n')}

Monthly Budgets:
${budgets.map(b => `- ${b.category}: Rp ${b.amount.toLocaleString('id-ID')}`).join('\n')}

Savings Goals:
${savings.map(s => `- ${s.name}: Progress Rp ${s.currentAmount.toLocaleString('id-ID')} of Rp ${s.targetAmount.toLocaleString('id-ID')}`).join('\n')}
`

    // 2. Ask Gemini
    const response = await askGemini(prompt, context)

    return NextResponse.json({ response })
  } catch (error: any) {
    console.error("AI Chat Error:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
