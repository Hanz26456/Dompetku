"use client"

import { useState, useEffect } from "react"
import { CATEGORIES_EXPENSE, formatRupiah } from "@/lib/types"

export default function AnggaranPage() {
  const [budgets, setBudgets] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7))
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [month])

  async function fetchData() {
    setLoading(true)
    try {
      const [bRes, tRes] = await Promise.all([
        fetch(`/api/budgets?month=${month}`).then(r => r.json()),
        fetch("/api/transactions").then(r => r.json())
      ])
      setBudgets(bRes || [])
      setTransactions(tRes || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveBudget(category: string, amount: string) {
    if (!amount) return
    setSavingId(category)
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, amount, month })
    })
    setSavingId(null)
    fetchData()
  }

  const getSpendingForCategory = (cat: string) => {
    return transactions
      .filter(t => t.type === "expense" && t.category === cat && t.date.startsWith(month))
      .reduce((sum, t) => sum + t.amount, 0)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl font-normal text-foreground font-serif tracking-tight">Atur <span className="text-primary italic font-bold">Anggaran</span></h1>
          <div className="flex items-center gap-2 mt-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
            <span>Tetapkan limit pengeluaran bulanan</span>
          </div>
        </div>
        <input 
          type="month" 
          value={month} 
          onChange={(e) => setMonth(e.target.value)}
          className="bg-secondary border border-border rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-20 italic font-serif">Memuat data anggaran...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES_EXPENSE.map(cat => {
            const budget = budgets.find(b => b.category === cat)
            const spending = getSpendingForCategory(cat)
            const limit = budget?.amount || 0
            const percent = limit > 0 ? Math.min((spending / limit) * 100, 100) : 0
            const isOver = spending > limit && limit > 0

            return (
              <div key={cat} className="group bg-card border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{cat}</div>
                  {isOver && (
                    <span className="text-[8px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded uppercase tracking-tighter animate-pulse">Over Budget</span>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-end justify-between gap-4">
                    <div className="flex-1">
                      <label className="text-[9px] text-muted-foreground uppercase font-bold mb-1 block">Limit (Rp)</label>
                      <input 
                        type="number"
                        placeholder="Set limit..."
                        defaultValue={limit || ""}
                        onBlur={(e) => {
                          if (e.target.value !== (limit || "").toString()) {
                            handleSaveBudget(cat, e.target.value)
                          }
                        }}
                        className="w-full bg-secondary/50 border border-border px-3 py-2 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    {savingId === cat && (
                      <div className="text-[10px] text-primary font-bold animate-bounce">Saving...</div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-muted-foreground">Terpakai</span>
                      <span className={isOver ? "text-rose-600" : "text-foreground"}>
                        {formatRupiah(spending)} / {limit > 0 ? formatRupiah(limit) : "—"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${isOver ? "bg-rose-500" : percent > 80 ? "bg-amber-500" : "bg-primary"}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
