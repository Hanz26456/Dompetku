"use client"

import { useState, useEffect } from "react"
import { formatRupiah } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"

export default function TabunganPage() {
  const [goals, setGoals] = useState<any[]>([])
  const [wallets, setWallets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showSaveForm, setShowSaveForm] = useState<{ goal: any; type: 'add' | 'withdraw' } | null>(null)
  
  // Goal Form
  const [goalForm, setGoalForm] = useState({ name: "", targetAmount: "" })
  
  // Save Form
  const [saveForm, setSaveForm] = useState({ walletId: "", amount: "" })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [gRes, wRes] = await Promise.all([
      fetch("/api/savings"),
      fetch("/api/wallets")
    ])
    setGoals(await gRes.json())
    setWallets(await wRes.json())
    setLoading(false)
  }

  async function handleCreateGoal() {
    if (!goalForm.name || !goalForm.targetAmount) return
    await fetch("/api/savings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(goalForm),
    })
    setShowGoalForm(false)
    setGoalForm({ name: "", targetAmount: "" })
    fetchData()
  }

  async function handleTransaction() {
    if (!showSaveForm || !saveForm.walletId || !saveForm.amount) return
    const res = await fetch("/api/savings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goalId: showSaveForm.goal.id,
        walletId: saveForm.walletId,
        amount: saveForm.amount,
        type: showSaveForm.type
      }),
    })
    if (res.ok) {
      setShowSaveForm(null)
      setSaveForm({ walletId: "", amount: "" })
      fetchData()
    } else {
      const err = await res.json()
      alert(err.error || "Gagal melakukan transaksi")
    }
  }

  async function handleDeleteGoal(id: string) {
    if (!confirm("Hapus target tabungan ini?")) return
    await fetch(`/api/savings?id=${id}`, { method: "DELETE" })
    fetchData()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Target Tabungan 🎯</h1>
          <p className="text-sm text-muted-foreground mt-1">Wujudkan impianmu dengan menabung terencana</p>
        </div>
        <button
          onClick={() => setShowGoalForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Buat Target Baru
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">Memuat target...</div>
      ) : goals.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-3xl p-20 text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h3 className="text-lg font-bold text-foreground mb-1">Belum ada target tabungan</h3>
          <p className="text-sm text-muted-foreground mb-6">Mulai rencanakan pembelian atau impianmu sekarang!</p>
          <button onClick={() => setShowGoalForm(true)} className="text-primary font-bold hover:underline">Buat target pertama →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {goals.map((g) => {
              const progress = Math.min((g.currentAmount / g.targetAmount) * 100, 100)
              return (
                <motion.div
                  key={g.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{g.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">Dibuat: {new Date(g.createdAt).toLocaleDateString("id-ID")}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteGoal(g.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/></svg>
                    </button>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Progress</span>
                      <span className="text-lg font-black text-primary">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-primary rounded-full"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Terkumpul</div>
                      <div className="text-lg font-bold text-foreground">{formatRupiah(g.currentAmount)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Target</div>
                      <div className="text-lg font-bold text-foreground">{formatRupiah(g.targetAmount)}</div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowSaveForm({ goal: g, type: 'withdraw' })}
                      className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground text-xs font-bold hover:bg-muted transition-colors"
                    >
                      Tarik Dana
                    </button>
                    <button 
                      onClick={() => setShowSaveForm({ goal: g, type: 'add' })}
                      className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      Tambah Saldo
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Goal Modal */}
      {showGoalForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border rounded-3xl p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-bold text-foreground mb-6">Target Baru 🎯</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase font-bold mb-2">Nama Barang / Impian</label>
                <input 
                  autoFocus
                  placeholder="Misal: iPhone 16 Pro, Liburan Jepang"
                  className="w-full rounded-xl bg-secondary border border-border px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  value={goalForm.name}
                  onChange={e => setGoalForm({...goalForm, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase font-bold mb-2">Target Nominal (Rp)</label>
                <input 
                  type="number"
                  placeholder="0"
                  className="w-full rounded-xl bg-secondary border border-border px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  value={goalForm.targetAmount}
                  onChange={e => setGoalForm({...goalForm, targetAmount: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowGoalForm(false)} className="flex-1 py-3 rounded-xl bg-secondary text-muted-foreground text-sm font-semibold">Batal</button>
              <button onClick={handleCreateGoal} className="flex-[2] py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20">Simpan Target</button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Save/Withdraw Modal */}
      {showSaveForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border rounded-3xl p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-bold text-foreground mb-1">
              {showSaveForm.type === 'add' ? "Tambah Tabungan" : "Tarik Tabungan"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">{showSaveForm.goal.name}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase font-bold mb-2">
                  {showSaveForm.type === 'add' ? "Ambil Dari Dompet" : "Masuk Ke Dompet"}
                </label>
                <select 
                  className="w-full rounded-xl bg-secondary border border-border px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  value={saveForm.walletId}
                  onChange={e => setSaveForm({...saveForm, walletId: e.target.value})}
                >
                  <option value="">Pilih Dompet...</option>
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({formatRupiah(w.balance)})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-muted-foreground uppercase font-bold mb-2">Nominal (Rp)</label>
                <input 
                  type="number"
                  placeholder="0"
                  className="w-full rounded-xl bg-secondary border border-border px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  value={saveForm.amount}
                  onChange={e => setSaveForm({...saveForm, amount: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowSaveForm(null)} className="flex-1 py-3 rounded-xl bg-secondary text-muted-foreground text-sm font-semibold">Batal</button>
              <button 
                onClick={handleTransaction} 
                className={`flex-[2] py-3 rounded-xl text-white text-sm font-bold shadow-lg ${showSaveForm.type === 'add' ? 'bg-primary shadow-primary/20' : 'bg-emerald-600 shadow-emerald-200 dark:shadow-none'}`}
              >
                Konfirmasi
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
