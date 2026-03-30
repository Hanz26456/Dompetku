export type TransactionType = "income" | "expense"
export type DebtType = "owe" | "owed"

export interface Transaction {
  id: string
  amount: number
  type: TransactionType
  category: string
  note: string
  date: string
  userId: string
  createdAt: string
}

export interface Debt {
  id: string
  name: string
  amount: number
  type: DebtType
  dueDate: string | null
  isPaid: boolean
  note: string
  userId: string
  createdAt: string
}

export const CATEGORIES_INCOME = ["Gaji", "Freelance", "Bisnis", "Investasi", "Hadiah", "Lainnya"]
export const CATEGORIES_EXPENSE = ["Makanan", "Transport", "Belanja", "Kesehatan", "Utilitas", "Hiburan", "Pendidikan", "Lainnya"]

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