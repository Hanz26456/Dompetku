"use client"

import { useState, useEffect } from "react"
import { formatRupiah } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"

export default function DompetPage() {
  const [wallets, setWallets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: "", balance: "" })

  useEffect(() => { fetchWallets() }, [])

  async function fetchWallets() {
    const res = await fetch("/api/wallets")
    setWallets(await res.json())
    setLoading(false)
  }

  async function handleSubmit() {
    if (!form.name) return
    await fetch("/api/wallets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    setShowForm(false)
    setForm({ name: "", balance: "" })
    fetchWallets()
  }

  async function handleDelete(id: string) {
    if (wallets.length <= 1) {
      alert("Kamu harus punya minimal satu dompet!")
      return
    }
    if (!confirm("Hapus dompet ini? Semua transaksi di dalamnya akan kehilangan referensi dompet (tapi tidak terhapus).")) return
    await fetch(`/api/wallets?id=${id}`, { method: "DELETE" })
    fetchWallets()
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Dompet</h1>
          <p className="text-sm text-muted-foreground mt-1">Atur kantong uang (Bank, Tunai, Tabungan)</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Tambah Dompet
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Memuat dompet...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {wallets.map((w) => (
              <motion.div
                key={w.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/30"
              >
                <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1 opacity-70">
                  {w.name === "Dompet Utama" ? "🏦 Default" : "💰 Wallet"}
                </div>
                <div className="text-xl font-bold text-foreground mb-4">{w.name}</div>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-black text-primary">
                    {formatRupiah(w.balance)}
                  </div>
                  <button
                    onClick={() => handleDelete(w.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                    title="Hapus Dompet"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Wallet Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-3xl p-8 w-full max-w-sm shadow-2xl"
          >
            <h2 className="text-xl font-bold text-foreground mb-6">Tambah Dompet Baru</h2>
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest font-bold mb-2">Nama Dompet</label>
                <input 
                  autoFocus
                  className="w-full rounded-xl bg-secondary border border-border px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20" 
                  placeholder="Misal: Bank BCA, Dana, Tunai" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase tracking-widest font-bold mb-2">Saldo Awal (Rp)</label>
                <input 
                  className="w-full rounded-xl bg-secondary border border-border px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20" 
                  type="number" 
                  placeholder="0" 
                  value={form.balance} 
                  onChange={(e) => setForm({ ...form, balance: e.target.value })} 
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setShowForm(false)} 
                className="flex-1 py-3 rounded-xl bg-secondary text-muted-foreground text-sm font-semibold cursor-pointer hover:text-foreground transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleSubmit} 
                className="flex-[2] py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold cursor-pointer hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                Simpan Dompet
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
