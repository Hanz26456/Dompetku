"use client"

import { useState, useEffect, useRef } from "react"
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
  const [splitForm, setSplitForm] = useState({ 
    total: "", 
    note: "Makan Bareng",
    participants: ["Teman 1"] 
  })
  const [isScanning, setIsScanning] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState("")
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  
  // Camera States
  const [showCamera, setShowCamera] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

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
      body: JSON.stringify({ ...form, receiptUrl }),
    })
    setShowForm(false)
    setReceiptUrl(null)
    setForm({ ...form, amount: "", note: "", date: new Date().toISOString().split("T")[0] })
    fetchTransactions()
    fetchWallets()
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        setReceiptUrl(data.url)
      }
    } catch (err) {
      console.error("Upload failed", err)
    } finally {
      setIsUploading(false)
    }
  }

  function handleSplitBill() {
    const totalVal = parseFloat(splitForm.total)
    const peopleVal = splitForm.participants.length + 1 // + self
    if (!totalVal || isNaN(totalVal)) return

    const perPerson = totalVal / peopleVal
    const text = `Halo! Ini rincian patungan *${splitForm.note}*:\n\nTotal: *${formatRupiah(totalVal)}*\nBagi: *${peopleVal} orang*\n\nPer orang bayar: *${formatRupiah(perPerson)}*\n\nBisa transfer ke rekening saya ya, terima kasih! 🙏`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")
    
    setForm(prev => ({ ...prev, type: "expense", amount: perPerson.toString(), note: `Patungan: ${splitForm.note}` }))
    setShowSplitModal(false)
    setShowForm(true)
  }

  async function handleSaveSplitPiutang() {
    const totalVal = parseFloat(splitForm.total)
    const peopleCount = splitForm.participants.length + 1
    if (!totalVal || isNaN(totalVal)) return
    
    const perPerson = totalVal / peopleCount
    
    for (const name of splitForm.participants) {
      await fetch("/api/debts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          amount: perPerson,
          type: "owed",
          note: `Split: ${splitForm.note}`,
        })
      })
    }

    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        type: "expense",
        amount: totalVal,
        note: `Split: ${splitForm.note} (${peopleCount} orang)`,
      })
    })

    setShowSplitModal(false)
    fetchTransactions()
    fetchWallets()
  }

  async function processScan(base64Data: string, mimeType: string) {
    setIsScanning(true)
    try {
      const res = await fetch("/api/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base64Image: base64Data,
          mimeType: mimeType
        })
      })
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || "Gagal memindai struk. Coba lagi.")
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
      if (data.receiptUrl) {
        setReceiptUrl(data.receiptUrl)
      }
    } catch (err) {
      console.error(err)
      alert("Terjadi kesalahan jaringan.")
    } finally {
      setIsScanning(false)
    }
  }

  async function handleScanReceipt(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = async () => {
      const base64String = reader.result as string
      const base64Data = base64String.split(",")[1]
      await processScan(base64Data, file.type)
    }
  }

  async function startCamera() {
    setShowCamera(true)
    setCameraLoading(true)
    try {
      const s = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } } 
      })
      setStream(s)
      if (videoRef.current) {
        videoRef.current.srcObject = s
      }
    } catch (err) {
      console.error("Camera access denied:", err)
      alert("Gagal mengakses kamera. Pastikan izin kamera sudah diberikan.")
      setShowCamera(false)
    } finally {
      setCameraLoading(false)
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setShowCamera(false)
  }

  async function capturePhoto() {
    if (!videoRef.current) return
    
    const canvas = document.createElement("canvas")
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    ctx.drawImage(videoRef.current, 0, 0)
    const base64String = canvas.toDataURL("image/jpeg", 0.8)
    const base64Data = base64String.split(",")[1]
    
    stopCamera()
    await processScan(base64Data, "image/jpeg")
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl font-normal text-foreground font-serif tracking-tight">Riwayat <span className="text-primary italic font-bold">Transaksi</span></h1>
          <div className="flex items-center gap-2 mt-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
            <span>Catat pemasukan & pengeluaran</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowSplitModal(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-muted transition-all active:scale-95">🍕 Split Bill</button>
          <button id="add-transaksi-btn" onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Tambah Transaksi
          </button>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 custom-scrollbar lg:grid lg:grid-cols-4 lg:overflow-visible">
        {wallets.map(w => (
          <div key={w.id} className="min-w-[150px] bg-card border border-border/60 rounded-xl p-4 shadow-sm shrink-0 transition-transform hover:scale-[1.02]">
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-0.5 shadow-sm font-black opacity-40">{w.name}</div>
            <div className="text-base font-black text-foreground tracking-tight">{formatRupiah(w.balance)}</div>
          </div>
        ))}
      </div>

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

      <div className="bg-card border border-border/60 rounded-3xl p-6 shadow-sm">
        <div className="flex gap-2 mb-10 border-b border-border/30 pb-6">
          {filterOptions.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`px-6 py-2 rounded-xl text-xs font-bold transition-all relative ${filter === f.key ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-secondary text-muted-foreground hover:bg-muted"}`}>{f.label}</button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-20 italic font-serif">Memuat data transaksi...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-20 italic font-serif">Belum ada transaksi ditemukan</p>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((t) => (
              <div key={t.id} className="group flex items-center gap-4 p-4 rounded-2xl bg-secondary/15 hover:bg-secondary/30 transition-all border border-transparent hover:border-border/40">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-110 ${t.type === "income" ? "bg-emerald-100 text-emerald-700 shadow-sm" : "bg-rose-100 text-rose-700 shadow-sm"}`}>
                  {ICON_MAP[t.category] ?? "📌"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mb-0.5">{t.category}</div>
                  <div className="text-sm font-bold text-foreground tracking-tight truncate">{t.note || t.category}</div>
                  <div className="text-[10px] text-muted-foreground/50 font-medium mt-0.5">{formatDate(t.date)}</div>
                </div>
                <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                  <div className={`text-base font-black tracking-tight ${t.type === "income" ? "text-emerald-700" : "text-rose-700"}`}>{t.type === "income" ? "+" : "−"}{formatRupiah(t.amount)}</div>
                  <div className="flex items-center gap-2">
                    {t.receiptUrl && (
                      <button onClick={() => { setSelectedReceipt(t.receiptUrl!); setShowReceiptModal(true) }} className="p-1 px-2 rounded-lg bg-primary/10 text-primary text-[10px] font-bold flex items-center gap-1 hover:bg-primary/20 transition-all">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> STRUK
                      </button>
                    )}
                    <button onClick={() => handleDelete(t.id)} className="p-1 rounded-lg text-muted-foreground/30 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100" title="Hapus">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <h2 className="text-lg font-bold text-foreground mb-1">Tambah Transaksi</h2>
            <p className="text-sm text-muted-foreground mb-5">Catat pemasukan atau pengeluaran baru</p>

            <div className="mb-5 p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
              <div>
                <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">✨ AI Scanner {isScanning && <svg className="animate-spin text-primary" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Auto-isi dari foto struk</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={startCamera}
                  className="bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/20 transition-all flex items-center gap-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  Live Scan
                </button>
                <label className={`relative cursor-pointer bg-secondary text-foreground px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity ${isScanning ? "opacity-50 pointer-events-none" : "hover:bg-muted"}`}>
                  {isScanning ? "Memindai..." : "📂 Galeri"}
                  <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleScanReceipt} disabled={isScanning} />
                </label>
              </div>
            </div>

            <div className="flex gap-2 mb-5">
              {(["expense", "income"] as const).map((t) => (
                <button key={t} onClick={() => setForm({ ...form, type: t, category: t === "income" ? "Gaji" : "Makanan" })} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all ${form.type === t ? (t === "income" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400") : "bg-secondary text-muted-foreground hover:text-foreground"}`}>{t === "income" ? "💰 Pemasukan" : "🛒 Pengeluaran"}</button>
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
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">🏷️ Bukti / Struk</label>
                <div className="flex items-center gap-3">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer ${isUploading ? "opacity-50 pointer-events-none" : ""}`}>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    <span className="text-xs font-bold text-muted-foreground">{isUploading ? "Mengunggah..." : "Upload Manual"}</span>
                  </label>
                  {receiptUrl && (
                    <div className="relative w-12 h-12 rounded-lg border border-border overflow-hidden group">
                      <img src={receiptUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button onClick={() => setReceiptUrl(null)} className="absolute inset-0 bg-rose-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl bg-secondary text-muted-foreground text-sm font-semibold cursor-pointer hover:text-foreground transition-colors">Batal</button>
              <button id="form-submit" onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity">Simpan Transaksi</button>
            </div>
          </div>
        </div>
      )}

      {showSplitModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <h2 className="text-lg font-bold text-foreground mb-1">🍕 Split Bill (Patungan)</h2>
            <p className="text-sm text-muted-foreground mb-5">Hitung bagi rata pengeluaran bareng teman</p>
            <div className="flex flex-col gap-4 overflow-y-auto pr-1 flex-1 custom-scrollbar">
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Total Tagihan (Rp)</label>
                <input className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" type="number" placeholder="0" value={splitForm.total} onChange={(e) => setSplitForm({ ...splitForm, total: e.target.value })} />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest font-semibold mb-1.5">Nama Acara / Makanan</label>
                <input className="w-full rounded-xl bg-secondary border border-border px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring" placeholder="Makan Malam" value={splitForm.note} onChange={(e) => setSplitForm({ ...splitForm, note: e.target.value })} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5"><label className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">Teman yang ikut</label><button onClick={() => setSplitForm(prev => ({ ...prev, participants: [...prev.participants, `Teman ${prev.participants.length + 1}`] }))} className="text-[10px] text-primary font-bold hover:opacity-70">+ Tambah Teman</button></div>
                <div className="flex flex-col gap-2">
                  {splitForm.participants.map((p, i) => (
                    <div key={i} className="flex gap-2">
                      <input className="flex-1 rounded-xl bg-secondary border border-border px-4 py-2 text-xs text-foreground outline-none" value={p} onChange={(e) => { const newPs = [...splitForm.participants]; newPs[i] = e.target.value; setSplitForm({ ...splitForm, participants: newPs }) }} />
                      {splitForm.participants.length > 1 && <button onClick={() => setSplitForm(prev => ({ ...prev, participants: prev.participants.filter((_, idx) => idx !== i) }))} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">✕</button>}
                    </div>
                  ))}
                </div>
              </div>
              {splitForm.total && <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center sticky bottom-0 bg-card z-10"><div className="text-xs text-muted-foreground mb-1">Per orang bayar ({splitForm.participants.length + 1} orang):</div><div className="text-lg font-bold text-primary">{formatRupiah(parseFloat(splitForm.total) / (splitForm.participants.length + 1))}</div></div>}
            </div>
            <div className="flex flex-col gap-2 mt-5">
              <div className="flex gap-2"><button onClick={() => setShowSplitModal(false)} className="flex-1 px-5 py-2.5 rounded-xl bg-secondary text-muted-foreground text-sm font-semibold cursor-pointer hover:text-foreground transition-colors">Batal</button><button onClick={handleSplitBill} className="flex-1 py-2.5 rounded-xl border border-emerald-600 text-emerald-600 text-xs font-semibold cursor-pointer hover:bg-emerald-50 transition-colors">📞 Kirim WA</button></div>
              <button onClick={handleSaveSplitPiutang} className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-black shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all">💾 Simpan ke Piutang</button>
            </div>
          </div>
        </div>
      )}

      {showReceiptModal && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
          <button onClick={() => setShowReceiptModal(false)} className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          <div className="w-full max-w-2xl h-full flex items-center justify-center"><img src={selectedReceipt} alt="Receipt Full" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" /></div>
          <p className="text-white/50 text-[10px] mt-4 font-black uppercase tracking-widest">Dompetku Receipt Archive</p>
        </div>
      )}
      {/* Camera Viewfinder Overlay */}
      {showCamera && (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col animate-in fade-in duration-300">
          {/* Header */}
          <div className="absolute top-0 inset-x-0 p-6 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
            <h3 className="text-white font-bold text-sm tracking-tight">Bidik Struk</h3>
            <button onClick={stopCamera} className="p-2 rounded-full bg-white/10 text-white backdrop-blur-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Viewfinder */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
            
            {/* Guide Frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[85%] h-[60%] border-2 border-white/40 rounded-3xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl animate-pulse" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl animate-pulse" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl animate-pulse" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl animate-pulse" />
              </div>
            </div>

            {cameraLoading && (
              <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Inisialisasi Kamera...</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-10 flex items-center justify-center bg-black">
            <button 
              onClick={capturePhoto}
              className="w-20 h-20 rounded-full border-4 border-white/20 p-1 active:scale-95 transition-transform"
            >
              <div className="w-full h-full rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.4)]" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}