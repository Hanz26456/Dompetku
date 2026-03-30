"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Transaction, Debt, formatRupiah, formatDate } from "@/lib/types"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"

function StatCard({ label, value, color, icon, trend, bgColor }: { label: string; value: string; color: string; icon: React.ReactNode; trend?: string; bgColor: string }) {
  return (
    <div className={`border border-border/40 rounded-2xl p-4 shadow-sm flex flex-col gap-2 transition-all hover:shadow-md ${bgColor}`}>
      <div className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-black opacity-60">
        {label}
      </div>
      <div className={`text-xl font-black tracking-tight ${color}`}>
        {value}
      </div>
      {trend && (
        <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg bg-white/40 self-start border border-black/5 ${color}`}>
          {trend}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [wallets, setWallets] = useState<any[]>([])
  const [savings, setSavings] = useState<any[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/transactions").then((r) => r.json()),
      fetch("/api/wallets").then((r) => r.json()),
      fetch("/api/savings").then((r) => r.json()),
      fetch("/api/debts").then((r) => r.json()),
      fetch("/api/budgets").then((r) => r.json()),
    ]).then(([txs, wls, svs, dbs, bgs]) => {
      setTransactions(txs || [])
      setWallets(wls || [])
      setSavings(svs || [])
      setDebts(dbs || [])
      setBudgets(bgs || [])
      setLoading(false)
    }).catch(err => {
      console.error("Dashboard Fetch Error:", err)
      setLoading(false)
    })
  }, [])

  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
  const totalDebt = debts.filter((d) => !d.isPaid).reduce((s, d) => s + d.amount, 0)
  const recent = transactions.slice(0, 5)
  
  const walletBalance = wallets.reduce((s, w) => s + w.balance, 0)
  const savingsBalance = savings.reduce((s, g) => s + g.currentAmount, 0)
  const totalBalance = walletBalance + savingsBalance

  // --- Chart Data Processing ---
  const currentMonthStr = new Date().toISOString().substring(0, 7)
  const catMap: Record<string, number> = {}
  const monthMap: Record<string, { name: string; income: number; expense: number; rawDate: string }> = {}

  transactions.forEach((t) => {
    // Pie Data
    if (t.type === "expense" && t.date.startsWith(currentMonthStr)) {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount
    }
    // Area Data
    const rawPeriod = t.date.substring(0, 7) // YYYY-MM
    const monthName = new Date(t.date).toLocaleDateString("id-ID", { month: "short" })
    if (!monthMap[rawPeriod]) {
      monthMap[rawPeriod] = { name: monthName, income: 0, expense: 0, rawDate: rawPeriod }
    }
    monthMap[rawPeriod][t.type === "income" ? "income" : "expense"] += t.amount
  })

  // Natural Earthy Colors for Pie
  const COLORS = ['#92400e', '#15803d', '#1d4ed8', '#7e22ce', '#b91c1c', '#0369a1', '#be185d', '#4338ca', '#374151']
  const pieData = Object.entries(catMap)
    .map(([name, value], i) => ({ name, value, fill: COLORS[i % COLORS.length] }))
    .sort((a,b) => b.value - a.value)

  const areaData = Object.values(monthMap)
    .sort((a,b) => a.rawDate.localeCompare(b.rawDate))
    .slice(-6)
  // -----------------------------

  const formatNumberShort = (num: number) => {
    if (Math.abs(num) >= 1_000_000) {
      return (num / 1_000_000).toFixed(1).replace('.', ',') + ' jt'
    }
    return formatRupiah(num)
  }

  const stats = [
    {
      label: "Pemasukan",
      value: loading ? "—" : formatNumberShort(income),
      trend: "+8% MoM",
      color: "text-emerald-700 dark:text-emerald-400",
      bgColor: "bg-emerald-50/50 dark:bg-emerald-950/20",
      icon: null,
    },
    {
      label: "Pengeluaran",
      value: loading ? "—" : formatNumberShort(expense),
      trend: "+3% MoM",
      color: "text-rose-700 dark:text-rose-400",
      bgColor: "bg-rose-50/50 dark:bg-rose-950/20",
      icon: null,
    },
    {
      label: "Hutang Aktif",
      value: loading ? "—" : formatNumberShort(totalDebt),
      trend: `${debts.filter(d => !d.isPaid).length} item`,
      color: "text-amber-700 dark:text-amber-400",
      bgColor: "bg-amber-50/50 dark:bg-amber-950/20",
      icon: null,
    },
    {
      label: "Total Saldo",
      value: loading ? "—" : formatNumberShort(totalBalance),
      trend: "Dompet + Target",
      color: totalBalance >= 0 ? "text-primary" : "text-rose-700 dark:text-rose-400",
      bgColor: "bg-primary/5 dark:bg-primary/10",
      icon: null,
    },
  ]

  const firstName = session?.user?.name?.split(" ")[0]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl font-normal text-foreground font-serif tracking-tight">
            Halo, <span className="text-primary italic font-bold">{firstName}</span> — selamat datang kembali.
          </h1>
          <div className="flex items-center gap-2 mt-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
            <span>{new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
            <span className="opacity-30">·</span>
            <span>Ringkasan Keuangan</span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Budget Alerts */}
      {!loading && budgets.length > 0 && (
        <div className="flex flex-col gap-4">
          {budgets.map(b => {
             const spending = transactions
               .filter(t => t.type === "expense" && t.category === b.category && t.date.startsWith(currentMonthStr))
               .reduce((s, t) => s + t.amount, 0)
             const percent = (spending / b.amount) * 100
             if (percent < 80) return null
             
             return (
               <div key={b.id} className={`flex items-center justify-between p-4 rounded-xl border animate-in slide-in-from-top-2 duration-500 ${percent >= 100 ? "bg-rose-50 border-rose-100 text-rose-800" : "bg-amber-50 border-amber-100 text-amber-800"}`}>
                 <div className="flex items-center gap-3">
                   <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${percent >= 100 ? "bg-rose-100" : "bg-amber-100"}`}>
                     {percent >= 100 ? "⚠️" : "💡"}
                   </div>
                   <div>
                     <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Peringatan Anggaran</div>
                     <div className="text-xs font-bold">Kategori {b.category} sudah terpakai {percent.toFixed(0)}% ({formatRupiah(spending)})</div>
                   </div>
                 </div>
                 <button onClick={() => router.push("/anggaran")} className="text-[10px] font-black uppercase tracking-widest underline decoration-2 underline-offset-4 hover:opacity-70 transition-opacity">Kelola</button>
               </div>
             )
          })}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Arus Kas */}
        <div className="xl:col-span-2 bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Arus Kas Bulanan</h2>
              <p className="text-[11px] text-muted-foreground mt-1">6 bulan terakhir</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">Memuat Grafik...</div>
            ) : areaData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground italic font-serif">Belum ada data transaksi</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#15803d" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#15803d" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b91c1c" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#b91c1c" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a8a29e', fontWeight: 600 }} dy={15} />
                  <Tooltip 
                    formatter={(val: any) => formatRupiah(val)} 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--card)', fontSize: '12px', fontWeight: 'bold' }}
                    cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area type="monotone" name="Pemasukan" dataKey="income" stroke="#15803d" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} dot={{ r: 4, fill: '#15803d', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Area type="monotone" name="Pengeluaran" dataKey="expense" stroke="#b91c1c" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#b91c1c', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Legend verticalAlign="bottom" height={36} iconType="plainline" wrapperStyle={{ fontSize: '10px', paddingTop: '20px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.7 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Kategori Pengeluaran */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="mb-6">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Pengeluaran Bulan Ini</h2>
          </div>
          <div className="h-[250px] w-full flex items-center justify-center relative">
            {loading ? (
              <div className="text-sm text-muted-foreground">Memuat Grafik...</div>
            ) : pieData.length === 0 ? (
              <div className="text-sm text-muted-foreground italic font-serif">Belum ada pengeluaran</div>
            ) : (
              <>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">total</span>
                  <span className="text-xl font-black">{formatNumberShort(expense)}</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip 
                      formatter={(val: any) => formatRupiah(val)}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    />
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
          <div className="mt-6 flex flex-col gap-2">
            {pieData.slice(0, 4).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="font-bold text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-black text-foreground">{formatNumberShort(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Transaksi Terbaru */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Transaksi Terbaru</h2>
            <button
              onClick={() => router.push("/transaksi")}
              className="text-[10px] text-primary font-black uppercase tracking-widest hover:opacity-70 transition-opacity flex items-center gap-1"
            >
              Lihat semua <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10 italic font-serif">Belum ada transaksi</p>
          ) : (
            <div className="flex flex-col gap-1">
              {recent.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 mb-0.5">{t.category}</div>
                    <div className="text-xs font-bold text-foreground tracking-tight">{t.note || t.category}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-black ${t.type === "income" ? "text-emerald-700" : "text-rose-700"}`}>
                      {t.type === "income" ? "+" : "−"}{formatRupiah(t.amount)}
                    </div>
                    <div className="text-[9px] text-muted-foreground/50 font-medium mt-0.5">{new Date(t.date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hutang & Piutang */}
        <div className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Hutang & Piutang</h2>
            <button
              onClick={() => router.push("/hutang")}
              className="text-[10px] text-primary font-black uppercase tracking-widest hover:opacity-70 transition-opacity flex items-center gap-1"
            >
              Kelola <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : debts.filter((d) => !d.isPaid).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10 italic font-serif">Tidak ada hutang aktif</p>
          ) : (
            <div className="flex flex-col gap-1">
              {debts.filter((d) => !d.isPaid).slice(0, 4).map((d) => (
                <div key={d.id} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                  <div>
                    <div className="text-xs font-bold text-foreground tracking-tight">{d.name}</div>
                    <div className="text-[9px] font-bold text-muted-foreground/40 mt-0.5 uppercase tracking-widest">
                      {d.type === "owe" ? "Hutang kamu" : "Piutang kamu"} · {new Date(d.createdAt).getFullYear()}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <div className="text-xs font-black text-foreground">
                      {formatRupiah(d.amount)}
                    </div>
                    <div className={`text-[7px] font-black px-1.5 py-0.5 rounded border tracking-widest uppercase
                      ${d.type === "owe" ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-emerald-50 border-emerald-100 text-emerald-700"}`}>
                      {d.type === "owe" ? "HUTANG" : "PIUTANG"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}