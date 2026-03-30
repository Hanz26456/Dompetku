"use client"

import { useState, useEffect } from "react"
import { Transaction, formatRupiah, CATEGORIES_EXPENSE } from "@/lib/types"
import { useSession } from "next-auth/react"
import { generatePDFReport, generateExcelReport } from "@/lib/report-generator"
import { FileDown, Printer, FileText, Table } from "lucide-react"
import { motion } from "framer-motion"

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
    <div className="print-safe space-y-8">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .print-safe, .print-safe * { visibility: visible; }
          .print-safe { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
          .no-print { display: none !important; }
          @page { margin: 1cm; }
        }
      `}} />

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl font-normal text-foreground font-serif tracking-tight">Laporan <span className="text-primary italic font-bold">Keuangan</span></h1>
          <div className="flex items-center gap-2 mt-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
            <span>Ringkasan & analisis anggaran</span>
          </div>
        </div>

        <div className="flex items-center gap-3 no-print">
          <input 
            type="month" 
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="rounded-2xl bg-card border border-border/60 px-6 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer font-bold transition-all hover:border-primary/40"
          />
          
          <div className="relative group">
            <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20 cursor-pointer">
              <FileDown size={18} />
              Export
            </button>
            <div className="absolute right-0 mt-3 w-56 bg-card border border-border/60 rounded-3xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-3 backdrop-blur-sm">
              <button onClick={handleExportPDF} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-secondary/60 rounded-2xl transition-colors cursor-pointer text-left font-medium">
                <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                  <FileText size={16} />
                </div>
                Download PDF
              </button>
              <button onClick={handleExportExcel} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-secondary/60 rounded-2xl transition-colors cursor-pointer text-left font-medium">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Table size={16} />
                </div>
                Download Excel
              </button>
              <div className="h-px bg-border/40 my-2 mx-4" />
              <button onClick={() => window.print()} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-secondary/60 rounded-2xl transition-colors cursor-pointer text-left font-medium">
                <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
                  <Printer size={16} />
                </div>
                Cetak Halaman
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 print-safe font-serif italic text-2xl hidden print:block text-primary">
        Laporan Bulan: {new Date(selectedMonth + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Total Pemasukan", value: formatRupiah(income), cls: "text-emerald-700", bg: "bg-emerald-50/50" },
          { label: "Total Pengeluaran", value: formatRupiah(expense), cls: "text-rose-700", bg: "bg-rose-50/50" },
          { label: balance >= 0 ? "Surplus Keuangan" : "Defisit Terjadi", value: formatRupiah(Math.abs(balance)), cls: balance >= 0 ? "text-primary" : "text-rose-700", bg: "bg-primary/5" },
        ].map((c) => (
          <div key={c.label} className={`border border-border/40 rounded-2xl p-5 shadow-sm break-inside-avoid ${c.bg}`}>
            <div className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] mb-3 font-black opacity-40">{c.label}</div>
            <div className={`text-xl font-black tracking-tighter ${c.cls}`}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-card border border-border/60 rounded-2xl p-5 break-inside-avoid shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-sm font-bold text-foreground font-serif tracking-tight">Realisasi <span className="italic text-primary">vs Anggaran</span></h2>
            <button 
              onClick={() => {
                setActiveCategory(CATEGORIES_EXPENSE[0])
                setBudgetInput("")
                setShowBudgetForm(true)
              }}
              className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline decoration-2 underline-offset-4 no-print cursor-pointer"
            >
              + Set Anggaran
            </button>
          </div>

          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground italic font-serif py-10">Belum ada pengeluaran di bulan ini</p>
          ) : (
            <div className="space-y-8">
              {categories.map(([cat, amt]) => {
                const limit = budgets[cat]
                const percentage = limit ? Math.min((amt / limit) * 100, 100) : 0
                
                let barColor = "bg-rose-400"
                if (limit) {
                  if (percentage < 75) barColor = "bg-emerald-500"
                  else if (percentage < 100) barColor = "bg-amber-500"
                  else barColor = "bg-rose-600"
                }

                return (
                  <div key={cat} className="group relative">
                    <div className="flex justify-between items-end mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-foreground tracking-tight">{cat}</span>
                        {limit && (
                          <button 
                            onClick={() => {
                              setActiveCategory(cat)
                              setBudgetInput(limit.toString())
                              setShowBudgetForm(true)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-black tracking-tighter bg-secondary px-2 py-1 rounded border border-border/40 text-muted-foreground hover:text-foreground no-print cursor-pointer uppercase"
                          >
                            Edit limit
                          </button>
                        )}
                      </div>
                      <div className="text-right flex items-baseline gap-1.5">
                        <span className="text-base font-black text-foreground tracking-tighter">{formatRupiah(amt)}</span>
                        {limit && (
                          <span className="text-[10px] text-muted-foreground font-bold uppercase opacity-50">
                            of {formatRupiah(limit)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="h-3 bg-secondary/50 rounded-full overflow-hidden relative p-0.5 border border-border/20">
                      {limit ? (
                        <div
                          className={`h-full ${barColor} rounded-full transition-all duration-1000 shadow-sm`}
                          style={{ width: `${percentage}%` }}
                        />
                      ) : (
                        <div
                          className="h-full bg-primary/20 rounded-full transition-all duration-1000"
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

        <div className="bg-card border border-border/60 rounded-2xl p-5 break-inside-avoid shadow-sm print:-mt-0">
          <h2 className="text-sm font-bold text-foreground mb-8 font-serif tracking-tight">Tren <span className="italic text-primary">6 Bulan</span> Terakhir</h2>
          {monthsTrend.length === 0 ? (
            <p className="text-sm text-muted-foreground italic font-serif py-10">Belum ada data tersedia</p>
          ) : (
            <div className="space-y-10">
              {monthsTrend.map(([month, data]) => {
                const maxVal = Math.max(data.income, data.expense) || 1
                return (
                  <div key={month} className="group">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-4 group-hover:text-primary/60 transition-colors">{month}</div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-2 bg-secondary/50 rounded-full overflow-hidden p-0.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(data.income / maxVal) * 100}%` }}
                            className="h-full bg-emerald-500 rounded-full shadow-sm shadow-emerald-100"
                          />
                        </div>
                        <span className="text-[11px] font-black text-emerald-700 w-24 text-right tracking-tighter">
                          {formatRupiah(data.income)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-2 bg-secondary/50 rounded-full overflow-hidden p-0.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(data.expense / maxVal) * 100}%` }}
                            className="h-full bg-rose-500 rounded-full shadow-sm shadow-rose-100"
                          />
                        </div>
                        <span className="text-[11px] font-black text-rose-700 w-24 text-right tracking-tighter">
                          {formatRupiah(data.expense)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {showBudgetForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 no-print">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border/60 rounded-[2.5rem] p-10 w-full max-w-sm shadow-2xl">
            <h2 className="text-2xl font-bold text-foreground font-serif mb-2">Set <span className="italic text-primary">Anggaran</span></h2>
            <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/40 mb-8">{selectedMonth.replace('-', ' · ')}</p>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-2 opacity-50">Kategori</label>
                <select 
                  className="w-full rounded-2xl bg-secondary border border-border/60 px-5 py-3.5 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                  value={activeCategory}
                  onChange={e => setActiveCategory(e.target.value)}
                >
                  {CATEGORIES_EXPENSE.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-[10px] text-muted-foreground uppercase tracking-widest font-black mb-2 opacity-50">Maksimum (Rp)</label>
                <input 
                  type="number"
                  placeholder="0"
                  className="w-full rounded-2xl bg-secondary border border-border/60 px-5 py-3.5 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  value={budgetInput}
                  onChange={e => setBudgetInput(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button 
                onClick={() => setShowBudgetForm(false)} 
                className="flex-1 py-4 rounded-2xl bg-secondary text-muted-foreground text-[10px] font-black uppercase tracking-widest hover:text-foreground transition-all"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveBudget} 
                className="flex-[2] py-4 rounded-2xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Simpan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}