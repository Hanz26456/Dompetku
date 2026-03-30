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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl font-normal text-foreground font-serif tracking-tight">Target <span className="text-primary italic font-bold">Tabungan</span> 🎯</h1>
          <div className="flex items-center gap-2 mt-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
            <span>Wujudkan impianmu dengan menabung terencana</span>
          </div>
        </div>
        <button
          onClick={() => setShowGoalForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Tambah Target
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground italic font-serif">Memuat target...</div>
      ) : goals.length === 0 ? (
        <div className="bg-card border border-dashed border-border/60 rounded-3xl p-12 text-center">
          <div className="text-5xl mb-6 transform transition-transform hover:scale-110 duration-500">🚀</div>
          <h3 className="text-2xl font-normal text-foreground mb-2 font-serif">Belum ada target tabungan</h3>
          <p className="text-sm text-muted-foreground mb-10 max-w-xs mx-auto">Mulai rencanakan pembelian atau impianmu sekarang dengan menabung cerdas.</p>
          <button onClick={() => setShowGoalForm(true)} className="text-primary font-black uppercase tracking-widest text-[10px] hover:underline decoration-2 underline-offset-8">Buat target pertama →</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {goals.map((g) => {
              const progress = Math.min((g.currentAmount / g.targetAmount) * 100, 100)
              return (
                <motion.div
                  key={g.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card border border-border/60 rounded-2xl p-5 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group"
                >
                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div>
                        <h3 className="text-xl font-bold text-foreground tracking-tight">{g.name}</h3>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-30 mt-1">Mulai: {new Date(g.createdAt).toLocaleDateString("id-ID")}</p>
                    </div>
                    <button 
                      onClick={() => handleDeleteGoal(g.id)}
                      className="p-3 rounded-2xl text-muted-foreground/30 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>

                  <div className="mb-10 relative z-10">
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black opacity-50">Tingkat Capaian</span>
                      <span className="text-lg font-black text-primary tracking-tighter">{progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-4 bg-secondary/50 rounded-full overflow-hidden p-1 border border-border/20">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-primary rounded-full shadow-lg shadow-primary/30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-10 relative z-10">
                    <div className="p-3 rounded-xl bg-secondary/30">
                      <div className="text-[8px] text-muted-foreground uppercase font-black tracking-widest opacity-40 mb-1">Terkumpul</div>
                      <div className="text-base font-black text-foreground tracking-tight">{formatRupiah(g.currentAmount)}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-primary/5">
                      <div className="text-[8px] text-muted-foreground uppercase font-black tracking-widest opacity-40 mb-1">Target Akhir</div>
                      <div className="text-base font-black text-foreground tracking-tight">{formatRupiah(g.targetAmount)}</div>
                    </div>
                  </div>

                  <div className="flex gap-4 relative z-10">
                    <button 
                      onClick={() => setShowSaveForm({ goal: g, type: 'withdraw' })}
                      className="flex-1 py-4 rounded-2xl bg-secondary/80 text-foreground text-xs font-black uppercase tracking-widest hover:bg-muted transition-all active:scale-95"
                    >
                      Tarik
                    </button>
                    <button 
                      onClick={() => setShowSaveForm({ goal: g, type: 'add' })}
                      className="flex-[2] py-4 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
                    >
                      Menabung
                    </button>
                  </div>
                  
                  {/* Background Decor */}
                  <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
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
