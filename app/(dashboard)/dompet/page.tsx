"use client"

import { useState, useEffect } from "react"
import { formatRupiah } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"

export default function DompetPage() {
  const [wallets, setWallets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState<any>(null)
  const [newWallet, setNewWallet] = useState({ name: "", balance: "" })
  const [editForm, setEditForm] = useState({ name: "", balance: "" })

  useEffect(() => {
    fetchWallets()
  }, [])

  async function fetchWallets() {
    setLoading(true)
    const res = await fetch("/api/wallets")
    const data = await res.json()
    setWallets(data)
    setLoading(false)
  }

  async function handleAddWallet() {
    if (!newWallet.name) return
    await fetch("/api/wallets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newWallet),
    })
    setShowAddModal(false)
    setNewWallet({ name: "", balance: "" })
    fetchWallets()
  }

  async function handleEditWallet() {
    if (!showEditModal) return
    await fetch("/api/wallets", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: showEditModal.id, ...editForm }),
    })
    setShowEditModal(null)
    fetchWallets()
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus dompet ini? Semua transaksi terkait akan ikut terhapus.")) return
    await fetch(`/api/wallets?id=${id}`, { method: "DELETE" })
    fetchWallets()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manajemen Dompet</h1>
          <p className="text-sm text-muted-foreground mt-1">Atur kantong uang (Bank, Tunai, Tabungan)</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Tambah Dompet
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Memuat data dompet...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {wallets.map((w) => (
              <motion.div
                key={w.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                {/* Background Decor */}
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M3 21h18M3 10h18M5 10V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3M7 21v-4M12 21v-4M17 21v-4"/></svg>
                    {w.name === "Dompet Utama" ? "Default" : "Wallet"}
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        setShowEditModal(w)
                        setEditForm({ name: w.name, balance: w.balance.toString() })
                      }}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-primary transition-colors"
                      title="Edit Saldo"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    {w.name !== "Dompet Utama" && (
                      <button 
                        onClick={() => handleDelete(w.id)}
                        className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Hapus"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    )}
                  </div>
                </div>

                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-foreground mb-1">{w.name}</h3>
                  <div className="text-2xl font-black text-primary">{formatRupiah(w.balance)}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border rounded-3xl p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-bold text-foreground mb-6">Tambah Dompet Baru</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase font-bold mb-2">Nama Dompet</label>
                <input 
                  autoFocus
                  placeholder="Misal: Bank Mandiri, E-Wallet"
                  className="w-full rounded-xl bg-secondary border border-border px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  value={newWallet.name}
                  onChange={e => setNewWallet({...newWallet, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase font-bold mb-2">Saldo Awal (Rp)</label>
                <input 
                  type="number"
                  placeholder="0"
                  className="w-full rounded-xl bg-secondary border border-border px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  value={newWallet.balance}
                  onChange={e => setNewWallet({...newWallet, balance: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl bg-secondary text-muted-foreground text-sm font-semibold">Batal</button>
              <button onClick={handleAddWallet} className="flex-[2] py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20">Simpan</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border rounded-3xl p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-bold text-foreground mb-6">Edit Dompet</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase font-bold mb-2">Nama Dompet</label>
                <input 
                  className="w-full rounded-xl bg-secondary border border-border px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase font-bold mb-2">Saldo Saat Ini (Rp)</label>
                <input 
                  type="number"
                  className="w-full rounded-xl bg-secondary border border-border px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  value={editForm.balance}
                  onChange={e => setEditForm({...editForm, balance: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowEditModal(null)} className="flex-1 py-3 rounded-xl bg-secondary text-muted-foreground text-sm font-semibold">Batal</button>
              <button onClick={handleEditWallet} className="flex-[2] py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20">Perbarui</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
