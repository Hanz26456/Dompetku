"use client"

import { useState, useEffect } from "react"
import { Transaction, formatRupiah, CATEGORIES_EXPENSE } from "@/lib/types"
import { useSession } from "next-auth/react"
import { generatePDFReport, generateExcelReport } from "@/lib/report-generator"
import { FileDown, Printer, FileText, Table } from "lucide-react"

type Budget = {
  id: string
  category: string
  amount: number
  month: string
}

export default function LaporanPage() {
  const { data: session } = useSession()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  // Budget modal state
  const [showBudgetForm, setShowBudgetForm] = useState(false)
  const [activeCategory, setActiveCategory] = useState("")
  const [budgetInput, setBudgetInput] = useState("")

  // Date filtering state
  const currentMonth = new Date().toISOString().substring(0, 7) // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  useEffect(() => {
    fetchData()
  }, [selectedMonth])

  async function fetchData() {
    setLoading(true)
    try {
      const [txRes, bgRes] = await Promise.all([
        fetch("/api/transactions"),
        fetch(`/api/budgets?month=${selectedMonth}`)
      ])
      
      const allTxs: Transaction[] = await txRes.json()
      const filteredTxs = allTxs.filter(t => t.date.substring(0, 7) === selectedMonth)
      setTransactions(filteredTxs)

      const bgs: Budget[] = await bgRes.json()
      const bgMap: Record<string, number> = {}
      bgs.forEach(b => bgMap[b.category] = b.amount)
      setBudgets(bgMap)
    } catch (e) {
      console.error("Fetch Data Error:", e)
    }
    setLoading(false)
  }

  async function handleSaveBudget() {
    if (!activeCategory || !budgetInput) return
    
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: activeCategory,
        amount: budgetInput,
        month: selectedMonth
      })
    })

    setShowBudgetForm(false)
    fetchData()
  }

  function handleExportPDF() {
    generatePDFReport(transactions, selectedMonth, session?.user?.name || "User", { income, expense, balance })
  }

  function handleExportExcel() {
    generateExcelReport(transactions, selectedMonth)
  }

  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
  const balance = income - expense

  const catMap: Record<string, number> = {}
  transactions.filter((t) => t.type === "expense").forEach((t) => {
    catMap[t.category] = (catMap[t.category] ?? 0) + t.amount
  })
  const categories = Object.entries(catMap).sort((a, b) => b[1] - a[1])

  Object.keys(budgets).forEach(cat => {
    if (catMap[cat] === undefined) {
      categories.push([cat, 0])
    }
  })

  const [allTransactionsForTrend, setAllTxsTrend] = useState<Transaction[]>([])
  useEffect(() => {
    fetch("/api/transactions").then(r => r.json()).then(setAllTxsTrend)
  }, [])

  const monthMap: Record<string, { income: number; expense: number }> = {}
  allTransactionsForTrend.forEach((t) => {
    const key = new Date(t.date).toLocaleDateString("id-ID", { month: "short", year: "numeric" })
    if (!monthMap[key]) monthMap[key] = { income: 0, expense: 0 }
    monthMap[key][t.type === "income" ? "income" : "expense"] += t.amount
  })
  const monthsTrend = Object.entries(monthMap).slice(-6)

  if (loading && transactions.length === 0) {
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
    <div className="print-safe">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .print-safe, .print-safe * { visibility: visible; }
          .print-safe { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
          .no-print { display: none !important; }
          @page { margin: 1cm; }
        }
      `}} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Laporan Keuangan</h1>
          <p className="text-sm text-muted-foreground mt-1">Ringkasan & analisis anggaran</p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <input 
            type="month" 
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="rounded-xl bg-card border border-border px-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          />
          
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition-opacity hover:opacity-90 cursor-pointer">
              <FileDown size={16} />
              Export
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
              <button onClick={handleExportPDF} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer text-left">
                <FileText size={14} className="text-red-500" />
                Download PDF
              </button>
              <button onClick={handleExportExcel} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer text-left">
                <Table size={14} className="text-emerald-500" />
                Download Excel
              </button>
              <div className="h-px bg-border my-1" />
              <button onClick={() => window.print()} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-lg transition-colors cursor-pointer text-left">
                <Printer size={14} className="text-muted-foreground" />
                Cetak Halaman
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 print-safe font-bold text-lg hidden print:block">
        Laporan Bulan: {new Date(selectedMonth + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Pemasukan", value: formatRupiah(income), cls: "text-emerald-600 dark:text-emerald-400" },
          { label: "Total Pengeluaran", value: formatRupiah(expense), cls: "text-red-500 dark:text-red-400" },
          { label: balance >= 0 ? "Surplus" : "Defisit", value: formatRupiah(Math.abs(balance)), cls: balance >= 0 ? "text-primary" : "text-red-500 dark:text-red-400" },
        ].map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-2xl p-5 break-inside-avoid shadow-sm">
            <div className="text-[11px] text-muted-foreground uppercase tracking-widest mb-2">{c.label}</div>
            <div className={`text-xl font-bold ${c.cls}`}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-2xl p-5 break-inside-avoid shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-foreground">Realisasi vs Anggaran</h2>
            <button 
              onClick={() => {
                setActiveCategory(CATEGORIES_EXPENSE[0])
                setBudgetInput("")
                setShowBudgetForm(true)
              }}
              className="text-xs font-semibold text-primary hover:underline no-print cursor-pointer"
            >
              + Set Anggaran
            </button>
          </div>

          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada pengeluaran di bulan ini</p>
          ) : (
            <div className="flex flex-col gap-5">
              {categories.map(([cat, amt]) => {
                const limit = budgets[cat]
                const percentage = limit ? Math.min((amt / limit) * 100, 100) : 0
                
                let barColor = "bg-red-400 dark:bg-red-500"
                if (limit) {
                  if (percentage < 75) barColor = "bg-emerald-400 dark:bg-emerald-500"
                  else if (percentage < 100) barColor = "bg-amber-400 dark:bg-amber-500"
                  else barColor = "bg-red-500 dark:bg-red-600"
                }

                return (
                  <div key={cat} className="group relative">
                    <div className="flex justify-between items-end text-sm mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-medium">{cat}</span>
                        {limit && (
                          <button 
                            onClick={() => {
                              setActiveCategory(cat)
                              setBudgetInput(limit.toString())
                              setShowBudgetForm(true)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-secondary px-2 py-0.5 rounded text-muted-foreground hover:text-foreground no-print cursor-pointer"
                          >
                            Edit limit
                          </button>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-foreground">{formatRupiah(amt)}</span>
                        {limit && (
                          <span className="text-xs text-muted-foreground ml-1 font-normal">
                            / {formatRupiah(limit)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="h-2.5 bg-secondary rounded-full overflow-hidden relative">
                      {limit ? (
                        <div
                          className={`h-full ${barColor} rounded-full transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      ) : (
                        <div
                          className="h-full bg-muted-foreground/30 rounded-full transition-all duration-500"
                          style={{ width: `${((amt / (expense||1)) * 100).toFixed(0)}%` }}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 break-inside-avoid shadow-sm print:-mt-0">
          <h2 className="text-sm font-semibold text-foreground mb-5">Tren 6 Bulan Terakhir</h2>
          {monthsTrend.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada data</p>
          ) : (
            <div className="flex flex-col gap-5">
              {monthsTrend.map(([month, data]) => {
                const maxVal = Math.max(data.income, data.expense) || 1
                return (
                  <div key={month}>
                    <div className="text-xs text-muted-foreground mb-2 font-medium">{month}</div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${(data.income / maxVal) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 w-24 text-right font-medium">
                        {formatRupiah(data.income)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-400 dark:bg-red-500 rounded-full transition-all duration-500"
                          style={{ width: `${(data.expense / maxVal) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-red-500 dark:text-red-400 w-24 text-right font-medium">
                        {formatRupiah(data.expense)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showBudgetForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-lg font-bold text-foreground mb-1">Set Anggaran ({selectedMonth})</h2>
            <p className="text-sm text-muted-foreground mb-5">Tentukan batas maksimal pengeluaran</p>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Kategori</label>
                <select 
                  className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  value={activeCategory}
                  onChange={e => setActiveCategory(e.target.value)}
                >
                  {CATEGORIES_EXPENSE.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Maksimal (Rp)</label>
                <input 
                  type="number"
                  placeholder="Contoh: 1500000"
                  className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  value={budgetInput}
                  onChange={e => setBudgetInput(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowBudgetForm(false)} 
                className="px-5 py-2.5 rounded-xl bg-secondary text-muted-foreground text-sm font-semibold cursor-pointer hover:text-foreground transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveBudget} 
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
              >
                Simpan Anggaran
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}