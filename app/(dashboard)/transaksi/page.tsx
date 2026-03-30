"use client"

import { useState, useEffect } from "react"
import { Transaction, CATEGORIES_INCOME, CATEGORIES_EXPENSE, formatRupiah, formatDate } from "@/lib/types"

const ICON_MAP: Record<string, string> = {
  Gaji: "💼", Freelance: "💻", Bisnis: "🏪", Investasi: "📈", Hadiah: "🎁",
  Makanan: "🍜", Transport: "⛽", Belanja: "🛒", Kesehatan: "🏥",
  Utilitas: "💡", Hiburan: "🎬", Pendidikan: "📚", Lainnya: "📌",
}

type Filter = "all" | "income" | "expense"

export default function TransaksiPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<Filter>("all")
  const [form, setForm] = useState({
    type: "expense", amount: "", category: "Makanan", note: "",
    date: new Date().toISOString().split("T")[0],
  })

  useEffect(() => { fetchTransactions() }, [])

  async function fetchTransactions() {
    const res = await fetch("/api/transactions")
    setTransactions(await res.json())
    setLoading(false)
  }

  async function handleSubmit() {
    if (!form.amount) return
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setShowForm(false)
    setForm({ type: "expense", amount: "", category: "Makanan", note: "", date: new Date().toISOString().split("T")[0] })
    fetchTransactions()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/transactions?id=${id}`, { method: "DELETE" })
    fetchTransactions()
  }

  const filtered = transactions.filter((t) => filter === "all" || t.type === filter)
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)

  const filterOptions: { key: Filter; label: string }[] = [
    { key: "all", label: "Semua" },
    { key: "income", label: "Pemasukan" },
    { key: "expense", label: "Pengeluaran" },
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transaksi</h1>
          <p className="text-sm text-muted-foreground mt-1">Catat pemasukan & pengeluaran</p>
        </div>
        <button
          id="add-transaksi-btn"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Tambah Transaksi
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Pemasukan", value: formatRupiah(totalIncome), cls: "text-emerald-600 dark:text-emerald-400" },
          { label: "Total Pengeluaran", value: formatRupiah(totalExpense), cls: "text-red-500 dark:text-red-400" },
          { label: "Selisih", value: formatRupiah(totalIncome - totalExpense), cls: totalIncome - totalExpense >= 0 ? "text-primary" : "text-red-500 dark:text-red-400" },
        ].map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-2xl p-5">
            <div className="text-[11px] text-muted-foreground uppercase tracking-widest mb-2">{c.label}</div>
            <div className={`text-xl font-bold ${c.cls}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* List card */}
      <div className="bg-card border border-border rounded-2xl p-5">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-5">
          {filterOptions.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                filter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-10">Memuat...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">Belum ada transaksi</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-muted transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                  t.type === "income" ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"
                }`}>
                  {ICON_MAP[t.category] ?? "📌"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{t.note || t.category}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.category} · {formatDate(t.date)}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-sm font-bold ${t.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                    {t.type === "income" ? "+" : "−"}{formatRupiah(t.amount)}
                  </div>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="text-xs text-muted-foreground hover:text-destructive cursor-pointer mt-0.5 transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-foreground mb-1">Tambah Transaksi</h2>
            <p className="text-sm text-muted-foreground mb-5">Catat pemasukan atau pengeluaran baru</p>

            {/* Type toggle */}
            <div className="flex gap-2 mb-5">
              {(["expense", "income"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, type: t, category: t === "income" ? "Gaji" : "Makanan" })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all ${
                    form.type === t
                      ? t === "income"
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                        : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "income" ? "💰 Pemasukan" : "🛒 Pengeluaran"}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              {[
                { label: "Nominal (Rp)", node: <input id="form-amount" className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" type="number" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /> },
                { label: "Kategori", node: <select id="form-category" className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{(form.type === "income" ? CATEGORIES_INCOME : CATEGORIES_EXPENSE).map((c) => <option key={c} value={c}>{c}</option>)}</select> },
                { label: "Catatan", node: <input id="form-note" className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" placeholder="Opsional" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /> },
                { label: "Tanggal", node: <input id="form-date" className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /> },
              ].map(({ label, node }) => (
                <div key={label}>
                  <label className="block text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">{label}</label>
                  {node}
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl bg-secondary text-muted-foreground text-sm font-semibold cursor-pointer hover:text-foreground transition-colors">
                Batal
              </button>
              <button id="form-submit" onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity">
                Simpan Transaksi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}