"use client"

import { useState, useEffect } from "react"
import { Debt, formatRupiah, formatDate } from "@/lib/types"

type Filter = "all" | "owe" | "owed"

function getDueBadge(dueDate: string | null, isPaid: boolean) {
  if (isPaid) return { text: "Lunas", cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" }
  if (!dueDate) return { text: "Aktif", cls: "bg-primary/10 text-primary" }
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000)
  if (diff < 0) return { text: "Terlambat!", cls: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" }
  if (diff <= 7) return { text: `${diff} hari lagi`, cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" }
  return { text: formatDate(dueDate), cls: "bg-primary/10 text-primary" }
}

function generateWaLink(debt: Debt) {
  // Format message
  const amountStr = formatRupiah(debt.amount)
  const dueStr = debt.dueDate ? ` (Jatuh tempo: ${formatDate(debt.dueDate)})` : ""
  
  const text = `Halo ${debt.name},\n\nSekadar mengingatkan terkait pinjaman sebesar *${amountStr}*${dueStr} yang belum lunas.\n\nMohon kabari jika sudah ditransfer ya. Terima kasih! 🙏`
  
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export default function HutangPage() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<Filter>("all")
  const [form, setForm] = useState({ name: "", amount: "", type: "owe", dueDate: "", note: "" })

  useEffect(() => { fetchDebts() }, [])

  async function fetchDebts() {
    const res = await fetch("/api/debts")
    setDebts(await res.json())
    setLoading(false)
  }

  async function handleSubmit() {
    if (!form.name || !form.amount) return
    await fetch("/api/debts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setShowForm(false)
    setForm({ name: "", amount: "", type: "owe", dueDate: "", note: "" })
    fetchDebts()
  }

  async function togglePaid(id: string, isPaid: boolean) {
    await fetch("/api/debts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isPaid: !isPaid }) })
    fetchDebts()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/debts?id=${id}`, { method: "DELETE" })
    fetchDebts()
  }

  const filtered = debts.filter((d) => filter === "all" || d.type === filter)
  const totalOwe = debts.filter((d) => d.type === "owe" && !d.isPaid).reduce((s, d) => s + d.amount, 0)
  const totalOwed = debts.filter((d) => d.type === "owed" && !d.isPaid).reduce((s, d) => s + d.amount, 0)

  const filterOptions: { key: Filter; label: string }[] = [
    { key: "all", label: "Semua" },
    { key: "owe", label: "Saya berhutang" },
    { key: "owed", label: "Saya dihutangi" },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hutang & Piutang</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola pinjaman & tagihan</p>
        </div>
        <button
          id="add-hutang-btn"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Tambah
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Saya berhutang", value: formatRupiah(totalOwe), cls: "text-red-500 dark:text-red-400" },
          { label: "Saya dihutangi", value: formatRupiah(totalOwed), cls: "text-emerald-600 dark:text-emerald-400" },
          { label: "Selisih bersih", value: formatRupiah(totalOwed - totalOwe), cls: totalOwed - totalOwe >= 0 ? "text-primary" : "text-red-500 dark:text-red-400" },
        ].map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-2xl p-5">
            <div className="text-[11px] text-muted-foreground uppercase tracking-widest mb-2">{c.label}</div>
            <div className={`text-xl font-bold ${c.cls}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex gap-2 mb-5">
          {filterOptions.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                filter === f.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-10">Memuat...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">Belum ada data</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((d) => {
              const badge = getDueBadge(d.dueDate, d.isPaid)
              return (
                <div
                  key={d.id}
                  className={`flex items-center gap-3 p-3.5 rounded-xl bg-secondary transition-opacity ${d.isPaid ? "opacity-50" : ""}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    d.type === "owe"
                      ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                      : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                  }`}>
                    {d.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground">
                      {d.name}{" "}
                      <span className="text-xs text-muted-foreground font-normal">
                        ({d.type === "owe" ? "hutang" : "piutang"})
                      </span>
                    </div>
                    {d.note && <div className="text-xs text-muted-foreground mt-0.5 truncate">{d.note}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-bold ${d.type === "owe" ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {formatRupiah(d.amount)}
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full inline-block mt-1 ${badge.cls}`}>
                      {badge.text}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => togglePaid(d.id, d.isPaid)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors border ${
                        d.isPaid
                          ? "border-border text-muted-foreground hover:text-foreground bg-secondary"
                          : "border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100"
                      }`}
                    >
                      {d.isPaid ? "Buka" : "Lunas"}
                    </button>
                    {!d.isPaid && d.type === "owed" && (
                      <a
                        href={generateWaLink(d)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors border border-green-200 dark:border-green-800 text-center flex items-center justify-center"
                        title="Kirim pengingat via WhatsApp"
                      >
                        Tagih WA
                      </a>
                    )}
                    <button
                      onClick={() => handleDelete(d.id)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-800"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-foreground mb-5">Tambah Hutang / Piutang</h2>

            <div className="flex gap-2 mb-5">
              {(["owe", "owed"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, type: t })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all ${
                    form.type === t
                      ? t === "owe"
                        ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                        : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "owe" ? "💳 Saya berhutang" : "📥 Saya dihutangi"}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              {[
                { label: "Nama", node: <input id="h-name" className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" placeholder="Nama orang / instansi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /> },
                { label: "Nominal (Rp)", node: <input id="h-amount" className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" type="number" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /> },
                { label: "Jatuh Tempo", node: <input id="h-due" className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /> },
                { label: "Catatan", node: <input id="h-note" className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" placeholder="Opsional" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /> },
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
              <button id="h-submit" onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}