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
  const [wallets, setWallets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showSplitModal, setShowSplitModal] = useState(false)
  const [filter, setFilter] = useState<Filter>("all")
  const [form, setForm] = useState({
    type: "expense", amount: "", category: "Makanan", note: "",
    date: new Date().toISOString().split("T")[0],
    walletId: "",
  })
  const [splitForm, setSplitForm] = useState({ total: "", people: "2", note: "Makan Bareng" })
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => { 
    fetchTransactions()
    fetchWallets()
  }, [])

  async function fetchWallets() {
    const res = await fetch("/api/wallets")
    const data = await res.json()
    setWallets(data)
    if (data.length > 0 && !form.walletId) {
      setForm(prev => ({ ...prev, walletId: data[0].id }))
    }
  }

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
    setForm({ ...form, amount: "", note: "", date: new Date().toISOString().split("T")[0] })
    fetchTransactions()
    fetchWallets()
  }

  function handleSplitBill() {
    const totalVal = parseFloat(splitForm.total)
    const peopleVal = parseInt(splitForm.people)
    if (!totalVal || !peopleVal) return

    const perPerson = totalVal / peopleVal
    const text = `Halo! Ini rincian patungan *${splitForm.note}*:\n\nTotal: *${formatRupiah(totalVal)}*\nBagi: *${peopleVal} orang*\n\nPer orang bayar: *${formatRupiah(perPerson)}*\n\nBisa transfer ke rekening saya ya, terima kasih! 🙏`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
    
    setForm(prev => ({ ...prev, type: "expense", amount: perPerson.toString(), note: `Patungan: ${splitForm.note}` }))
    setShowSplitModal(false)
    setShowForm(true)
  }

  async function handleScanReceipt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsScanning(true)
    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = async () => {
        const base64String = reader.result as string
        const base64Data = base64String.split(",")[1]
        
        try {
          const res = await fetch("/api/scan-receipt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              base64Image: base64Data,
              mimeType: file.type
            })
          })
          
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            alert(err.error || "Gagal memindai struk. Coba lagi.")
            setIsScanning(false)
            return
          }
          
          const data = await res.json()
          setForm(prev => ({
            ...prev,
            type: "expense",
            amount: data.amount ? data.amount.toString() : prev.amount,
            note: data.note || prev.note,
            category: data.category || "Lainnya"
          }))
        } catch (err) {
          console.error(err)
          alert("Terjadi kesalahan jaringan.")
        }
        setIsScanning(false)
      }
      reader.onerror = () => {
        alert("Gagal membaca file gambar")
        setIsScanning(false)
      }
    } catch (error) {
      console.error(error)
      alert("Terjadi kesalahan sistem")
      setIsScanning(false)
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/transactions?id=${id}`, { method: "DELETE" })
    fetchTransactions()
    fetchWallets()
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl font-normal text-foreground font-serif tracking-tight">Riwayat <span className="text-primary italic font-bold">Transaksi</span></h1>
          <div className="flex items-center gap-2 mt-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
            <span>Catat pemasukan & pengeluaran</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSplitModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-muted transition-all active:scale-95"
          >
            🍕 Split Bill
          </button>
          <button
            id="add-transaksi-btn"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Tambah Transaksi
          </button>
        </div>
      </div>

      {/* Wallet overview */}
      <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar lg:grid lg:grid-cols-4 lg:overflow-visible">
        {wallets.map(w => (
          <div key={w.id} className="min-w-[150px] bg-card border border-border/60 rounded-xl p-4 shadow-sm shrink-0 transition-transform hover:scale-[1.02]">
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-0.5 shadow-sm font-black opacity-40">{w.name}</div>
            <div className="text-base font-black text-foreground tracking-tight">{formatRupiah(w.balance)}</div>
          </div>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Pemasukan", value: formatRupiah(totalIncome), cls: "text-emerald-700", bg: "bg-emerald-50/50" },
          { label: "Total Pengeluaran", value: formatRupiah(totalExpense), cls: "text-rose-700", bg: "bg-rose-50/50" },
          { label: "Selisih Bersih", value: formatRupiah(totalIncome - totalExpense), cls: "text-amber-800", bg: "bg-primary/5" },
        ].map((c) => (
          <div key={c.label} className={`border border-border/40 rounded-2xl p-5 shadow-sm ${c.bg}`}>
            <div className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] mb-3 font-black opacity-40">{c.label}</div>
            <div className={`text-xl font-black tracking-tight ${c.cls}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* List content */}
      <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-10 border-b border-border/30 pb-6">
          {filterOptions.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all relative
                ${filter === f.key
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-secondary text-muted-foreground hover:bg-muted"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-20 italic font-serif">Memuat data transaksi...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-20 italic font-serif">Belum ada transaksi ditemukan</p>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="group flex items-center gap-4 p-4 rounded-2xl bg-secondary/15 hover:bg-secondary/30 transition-all border border-transparent hover:border-border/40"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-110 ${
                  t.type === "income" ? "bg-emerald-100 text-emerald-700 shadow-sm" : "bg-rose-100 text-rose-700 shadow-sm"
                }`}>
                  {ICON_MAP[t.category] ?? "📌"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mb-0.5">{t.category}</div>
                  <div className="text-sm font-bold text-foreground tracking-tight truncate">{t.note || t.category}</div>
                  <div className="text-[10px] text-muted-foreground/50 font-medium mt-0.5">{formatDate(t.date)}</div>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                  <div className={`text-base font-black tracking-tight ${t.type === "income" ? "text-emerald-700" : "text-rose-700"}`}>
                    {t.type === "income" ? "+" : "−"}{formatRupiah(t.amount)}
                  </div>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-1 rounded-lg text-muted-foreground/30 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                    title="Hapus"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-lg font-bold text-foreground mb-1">Tambah Transaksi</h2>
            <p className="text-sm text-muted-foreground mb-5">Catat pemasukan atau pengeluaran baru</p>

            {/* AI Scanner */}
            <div className="mb-5 p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                  ✨ AI Scanner
                  {isScanning && (
                    <svg className="animate-spin text-primary" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">Auto-isi dari foto struk</div>
              </div>
              <label className={`relative cursor-pointer bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity ${isScanning ? "opacity-50 pointer-events-none" : "hover:opacity-90"}`}>
                {isScanning ? "Memindai..." : "📷 Upload"}
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleScanReceipt}
                  disabled={isScanning}
                />
              </label>
            </div>

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
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Nominal (Rp)</label>
                <input id="form-amount" className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" type="number" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </div>

              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Pakai Dompet</label>
                <select className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" value={form.walletId} onChange={(e) => setForm({ ...form, walletId: e.target.value })}>
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({formatRupiah(w.balance)})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Kategori</label>
                <select id="form-category" className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {(form.type === "income" ? CATEGORIES_INCOME : CATEGORIES_EXPENSE).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Catatan</label>
                <input id="form-note" className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" placeholder="Opsional" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </div>

              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Tanggal</label>
                <input id="form-date" className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
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

      {/* Split Bill Modal */}
      {showSplitModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-lg font-bold text-foreground mb-1">🍕 Split Bill (Patungan)</h2>
            <p className="text-sm text-muted-foreground mb-5">Hitung bagi rata pengeluaran bareng teman</p>
            
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Total Tagihan (Rp)</label>
                <input className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" type="number" placeholder="0" value={splitForm.total} onChange={(e) => setSplitForm({ ...splitForm, total: e.target.value })} />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Jumlah Orang</label>
                <input className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" type="number" placeholder="2" value={splitForm.people} onChange={(e) => setSplitForm({ ...splitForm, people: e.target.value })} />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Nama Acara / Makanan</label>
                <input className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" placeholder="Makan Malam" value={splitForm.note} onChange={(e) => setSplitForm({ ...splitForm, note: e.target.value })} />
              </div>
              
              {splitForm.total && splitForm.people && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
                  <div className="text-xs text-muted-foreground mb-1">Per orang bayar:</div>
                  <div className="text-lg font-bold text-primary">{formatRupiah(parseFloat(splitForm.total) / parseInt(splitForm.people))}</div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowSplitModal(false)} className="px-5 py-2.5 rounded-xl bg-secondary text-muted-foreground text-sm font-semibold cursor-pointer hover:text-foreground transition-colors">
                Batal
              </button>
              <button onClick={handleSplitBill} className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold cursor-pointer hover:bg-emerald-700 transition-colors">
                Bagikan ke WA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}