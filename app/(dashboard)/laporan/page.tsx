"use client"

import { useState, useEffect } from "react"
import { Transaction, formatRupiah } from "@/lib/types"

export default function LaporanPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/transactions").then((r) => r.json()).then((data) => {
      setTransactions(data)
      setLoading(false)
    })
  }, [])

  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
  const balance = income - expense

  const catMap: Record<string, number> = {}
  transactions.filter((t) => t.type === "expense").forEach((t) => {
    catMap[t.category] = (catMap[t.category] ?? 0) + t.amount
  })
  const categories = Object.entries(catMap).sort((a, b) => b[1] - a[1])

  const monthMap: Record<string, { income: number; expense: number }> = {}
  transactions.forEach((t) => {
    const key = new Date(t.date).toLocaleDateString("id-ID", { month: "short", year: "numeric" })
    if (!monthMap[key]) monthMap[key] = { income: 0, expense: 0 }
    monthMap[key][t.type === "income" ? "income" : "expense"] += t.amount
  })
  const months = Object.entries(monthMap).slice(-6)

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-muted-foreground text-sm">
        <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        Memuat...
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Laporan Keuangan</h1>
        <p className="text-sm text-muted-foreground mt-1">Ringkasan & analisis</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Pemasukan", value: formatRupiah(income), cls: "text-emerald-600 dark:text-emerald-400" },
          { label: "Total Pengeluaran", value: formatRupiah(expense), cls: "text-red-500 dark:text-red-400" },
          { label: balance >= 0 ? "Surplus" : "Defisit", value: formatRupiah(Math.abs(balance)), cls: balance >= 0 ? "text-primary" : "text-red-500 dark:text-red-400" },
        ].map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-2xl p-5">
            <div className="text-[11px] text-muted-foreground uppercase tracking-widest mb-2">{c.label}</div>
            <div className={`text-xl font-bold ${c.cls}`}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Category breakdown */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-5">Pengeluaran per Kategori</h2>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada data</p>
          ) : (
            <div className="flex flex-col gap-4">
              {categories.map(([cat, amt]) => (
                <div key={cat}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-foreground font-medium">{cat}</span>
                    <span className="text-red-500 dark:text-red-400 font-bold">{formatRupiah(amt)}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400 dark:bg-red-500 rounded-full transition-all duration-500"
                      style={{ width: `${((amt / expense) * 100).toFixed(0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly trend */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-5">Tren Bulanan</h2>
          {months.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada data</p>
          ) : (
            <div className="flex flex-col gap-5">
              {months.map(([month, data]) => (
                <div key={month}>
                  <div className="text-xs text-muted-foreground mb-2 font-medium">{month}</div>
                  {/* Income bar */}
                  <div className="flex items-center gap-3 mb-1.5">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((data.income / (income || 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 w-24 text-right font-medium">
                      {formatRupiah(data.income)}
                    </span>
                  </div>
                  {/* Expense bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-400 dark:bg-red-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((data.expense / (expense || 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-red-500 dark:text-red-400 w-24 text-right font-medium">
                      {formatRupiah(data.expense)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}