import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json([], { status: 401 })

  const wallets = await prisma.wallet.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  })
  
  // Auto-seed default wallet if none exists
  if (wallets.length === 0) {
    const defaultWallet = await prisma.wallet.create({
      data: {
        name: "Dompet Utama",
        balance: 0,
        userId: session.user.id
      }
    })
    return NextResponse.json([defaultWallet])
  }

  return NextResponse.json(wallets)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, balance } = await req.json()
  const wallet = await prisma.wallet.create({
    data: {
      name,
      balance: parseFloat(balance) || 0,
      userId: session.user.id,
    },
  })
  return NextResponse.json(wallet)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 })

  await prisma.wallet.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, name, balance } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 })

  const wallet = await prisma.wallet.update({
    where: { id },
    data: {
      name: name !== undefined ? name : undefined,
      balance: balance !== undefined ? parseFloat(balance) : undefined,
    },
  })

  return NextResponse.json(wallet)
}
