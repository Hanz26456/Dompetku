export type TransactionType = "income" | "expense"
export type DebtType = "owe" | "owed"

export interface Transaction {
  id: string
  amount: number
  type: TransactionType
  category: string
  note: string | null
  date: string
  userId: string
  walletId?: string | null
  savingsGoalId?: string | null
  receiptUrl?: string | null
  createdAt: string
}

export interface Wallet {
  id: string
  name: string
  balance: number
  userId: string
  createdAt: string
}

export interface SavingsGoal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  userId: string
  createdAt: string
  updatedAt: string
}

export interface DebtPayment {
  id: string
  amount: number
  date: string
  debtId: string
  walletId?: string | null
  transactionId?: string | null
  createdAt: string
}

export interface Debt {
  id: string
  name: string
  amount: number
  type: DebtType
  dueDate: string | null
  isPaid: boolean
  note: string | null
  userId: string
  payments: DebtPayment[]
  createdAt: string
}

export const CATEGORIES_INCOME = ["Gaji", "Freelance", "Bisnis", "Investasi", "Hadiah", "Lainnya"]
export const CATEGORIES_EXPENSE = ["Makanan", "Transport", "Belanja", "Kesehatan", "Utilitas", "Hiburan", "Pendidikan", "Tabungan", "Lainnya"]

export function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric"
  })
}