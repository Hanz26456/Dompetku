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
  const amountStr = formatRupiah(debt.amount)
  const dueStr = debt.dueDate ? ` (Jatuh tempo: ${formatDate(debt.dueDate)})` : ""
  const text = `Halo ${debt.name},\n\nSekadar mengingatkan terkait pinjaman sebesar *${amountStr}*${dueStr} yang belum lunas.\n\nMohon kabari jika sudah ditransfer ya. Terima kasih! 🙏`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export default function HutangPage() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [wallets, setWallets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [filter, setFilter] = useState<Filter>("all")
  const [form, setForm] = useState({ name: "", amount: "", type: "owe", dueDate: "", note: "" })
  const [paymentForm, setPaymentForm] = useState({ amount: "", debtId: "", walletId: "", date: new Date().toISOString().split("T")[0] })

  useEffect(() => { 
    fetchDebts() 
    fetchWallets()
  }, [])

  async function fetchWallets() {
    const res = await fetch("/api/wallets")
    setWallets(await res.json())
  }

  async function fetchDebts() {
    const res = await fetch("/api/debts")
    const data = await res.json()
    setDebts(Array.isArray(data) ? data : [])
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

  async function handlePaymentSubmit() {
    if (!paymentForm.amount || !paymentForm.walletId) return
    await fetch("/api/debts/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentForm),
    })
    setShowPaymentForm(false)
    setPaymentForm({ amount: "", debtId: "", walletId: "", date: new Date().toISOString().split("T")[0] })
    fetchDebts()
    fetchWallets()
  }

  const safeDebts = Array.isArray(debts) ? debts : []
  const filtered = safeDebts.filter((d) => filter === "all" || d.type === filter)
  const totalOwe = safeDebts.filter((d) => d.type === "owe" && !d.isPaid).reduce((s, d) => s + (d.amount - (d.payments?.reduce((ss, pp) => ss + pp.amount, 0) || 0)), 0)
  const totalOwed = safeDebts.filter((d) => d.type === "owed" && !d.isPaid).reduce((s, d) => s + (d.amount - (d.payments?.reduce((ss, pp) => ss + pp.amount, 0) || 0)), 0)

  const filterOptions: { key: Filter; label: string }[] = [
    { key: "all", label: "Semua" },
    { key: "owe", label: "Saya berhutang" },
    { key: "owed", label: "Saya dihutangi" },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-normal text-foreground font-serif tracking-tight">Hutang & <span className="text-primary italic font-bold">Piutang</span></h1>
          <div className="flex items-center gap-2 mt-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
            <span>Kelola pinjaman & tagihan</span>
            <span className="opacity-30">·</span>
            <span>Dompetku Finance</span>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Tambah
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Saya berhutang", value: formatRupiah(totalOwe), cls: "text-rose-700", bg: "bg-rose-50/50" },
          { label: "Saya dihutangi", value: formatRupiah(totalOwed), cls: "text-emerald-700", bg: "bg-emerald-50/50" },
          { label: "Selisih Bersih", value: formatRupiah(totalOwed - totalOwe), cls: totalOwed - totalOwe >= 0 ? "text-primary" : "text-rose-700", bg: "bg-primary/5" },
        ].map((c) => (
          <div key={c.label} className={`border border-border/40 rounded-2xl p-5 shadow-sm ${c.bg}`}>
            <div className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] mb-3 font-black opacity-40">{c.label}</div>
            <div className={`text-xl font-black tracking-tight ${c.cls}`}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
        <div className="flex gap-2 mb-10 border-b border-border/30 pb-6 overflow-x-auto no-scrollbar scroll-smooth snap-x">
          {filterOptions.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative shrink-0 snap-center
                ${filter === f.key ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-secondary text-muted-foreground hover:bg-muted"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-20 italic font-serif">Memuat data...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-20 italic font-serif">Belum ada data ditemukan</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((d) => {
              const badge = getDueBadge(d.dueDate, d.isPaid)
              const paidAmount = d.payments?.reduce((s, p) => s + p.amount, 0) || 0
              const percent = Math.min(100, (paidAmount / d.amount) * 100)
              const remaining = d.amount - paidAmount

              return (
                <div
                  key={d.id}
                  className={`group flex items-center gap-4 p-3 rounded-2xl bg-secondary/20 hover:bg-secondary/40 transition-all border border-transparent hover:border-border/60 ${d.isPaid ? "opacity-60" : ""}`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black shrink-0 transition-transform group-hover:scale-110 ${
                    d.type === "owe" ? "bg-rose-100 text-rose-700 shadow-sm" : "bg-emerald-100 text-emerald-700 shadow-sm"
                  }`}>
                    {d.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className="text-sm font-bold text-foreground tracking-tight truncate">{d.name}</div>
                      <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border tracking-widest uppercase
                        ${d.type === "owe" ? "border-rose-200 text-rose-600 bg-rose-50" : "border-emerald-200 text-emerald-600 bg-emerald-50"}`}>
                        {d.type === "owe" ? "HUTANG" : "PIUTANG"}
                      </span>
                    </div>
                    {d.note && <div className="text-[10px] text-muted-foreground/50 font-medium truncate">{d.note}</div>}
                    
                    {!d.isPaid && (
                      <div className="mt-2 w-full max-w-[150px]">
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter mb-1 opacity-40">
                          <span>Progress</span>
                          <span>{percent.toFixed(0)}%</span>
                        </div>
                        <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${d.type === "owe" ? "bg-rose-500" : "bg-emerald-500"}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-base font-black tracking-tight ${d.type === "owe" ? "text-rose-700" : "text-emerald-700"}`}>
                      {formatRupiah(remaining)}
                    </div>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-lg font-black mt-1 inline-block uppercase tracking-wider ${badge.cls}`}>
                      {badge.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-all ml-4">
                    {!d.isPaid && (
                      <button
                        onClick={() => {
                          setPaymentForm({ ...paymentForm, debtId: d.id, amount: remaining.toString() })
                          setShowPaymentForm(true)
                        }}
                        className="p-2.5 rounded-xl text-primary bg-primary/5 hover:bg-primary/10 transition-all border border-primary/20"
                        title="Bayar Cicilan"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                      </button>
                    )}
                    <button
                      onClick={() => togglePaid(d.id, d.isPaid)}
                      className={`p-2 rounded-lg transition-all border ${d.isPaid ? "border-border text-muted-foreground hover:bg-secondary" : "border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"}`}
                      title={d.isPaid ? "Belum Lunas" : "Tandai Lunas"}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        {d.isPaid ? (
                          <>
                            <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>
                          </>
                        ) : (
                          <polyline points="20 6 9 17 4 12"/>
                        )}
                      </svg>
                    </button>
                    {!d.isPaid && d.type === "owed" && (
                      <a href={generateWaLink(d)} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-xl text-green-700 bg-green-50 hover:bg-green-100 transition-all border border-green-200">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-10.4 8.38 8.38 0 0 1 3.9 1.1L21 3z"/></svg>
                      </a>
                    )}
                    <button onClick={() => handleDelete(d.id)} className="p-2.5 rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 transition-all border border-rose-200">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-foreground mb-5">Tambah Hutang / Piutang</h2>
            <div className="flex gap-2 mb-5">
              {(["owe", "owed"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, type: t })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    form.type === t ? (t === "owe" ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400") : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "owe" ? "💳 Saya berhutang" : "📥 Saya dihutangi"}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Nama</label>
                <input className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" placeholder="Nama orang / instansi" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Nominal (Rp)</label>
                <input className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" type="number" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Jatuh Tempo</label>
                <input className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Catatan</label>
                <input className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" placeholder="Opsional" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl bg-secondary text-muted-foreground text-sm font-semibold cursor-pointer hover:text-foreground transition-colors">Batal</button>
              <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {showPaymentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in zoom-in duration-200">
            <h2 className="text-lg font-bold text-foreground mb-1">💰 Bayar Cicilan</h2>
            <p className="text-xs text-muted-foreground mb-6">Pilih dompet dan masukkan nominal pembayaran</p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Nominal (Rp)</label>
                <input className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring font-black" type="number" placeholder="0" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Sumber Dana (Dompet)</label>
                <select className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring cursor-pointer" value={paymentForm.walletId} onChange={(e) => setPaymentForm({ ...paymentForm, walletId: e.target.value })}>
                  <option value="">Pilih Dompet</option>
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name} — {formatRupiah(w.balance)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Tanggal Bayar</label>
                <input className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowPaymentForm(false)} className="px-5 py-2.5 rounded-xl bg-secondary text-muted-foreground text-xs font-bold cursor-pointer hover:text-foreground transition-colors">Batal</button>
              <button onClick={handlePaymentSubmit} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-black shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity">Simpan Pembayaran</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}