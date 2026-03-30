"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Transaction, Debt, formatRupiah, formatDate } from "@/lib/types"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts"

function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className={`mb-3 ${color}`}>{icon}</div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/transactions").then((r) => r.json()),
      fetch("/api/debts").then((r) => r.json()),
    ]).then(([txs, dbs]) => {
      setTransactions(txs)
      setDebts(dbs)
      setLoading(false)
    })
  }, [])

  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
  const totalDebt = debts.filter((d) => !d.isPaid).reduce((s, d) => s + d.amount, 0)
  const recent = transactions.slice(0, 5)
  const netBalance = income - expense

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

  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef']
  const pieData = Object.entries(catMap)
    .map(([name, value], i) => ({ name, value, fill: COLORS[i % COLORS.length] }))
    .sort((a,b) => b.value - a.value)

  const areaData = Object.values(monthMap)
    .sort((a,b) => a.rawDate.localeCompare(b.rawDate))
    .slice(-6)
  // -----------------------------

  const stats = [
    {
      label: "Pemasukan",
      value: loading ? "—" : formatRupiah(income),
      color: "text-emerald-600 dark:text-emerald-400",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    },
    {
      label: "Pengeluaran",
      value: loading ? "—" : formatRupiah(expense),
      color: "text-red-500 dark:text-red-400",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>,
    },
    {
      label: "Hutang Aktif",
      value: loading ? "—" : formatRupiah(totalDebt),
      color: "text-amber-600 dark:text-amber-400",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    },
    {
      label: "Saldo Bersih",
      value: loading ? "—" : formatRupiah(netBalance),
      color: netBalance >= 0 ? "text-primary" : "text-red-500 dark:text-red-400",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    },
  ]

  const firstName = session?.user?.name?.split(" ")[0]

  return (
    <div>
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-foreground">
          Selamat datang, {firstName} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Arus Kas */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Arus Kas Bulanan</h2>
          </div>
          <div className="h-[250px] w-full">
            {loading ? (
              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">Memuat Grafik...</div>
            ) : areaData.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">Belum ada data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888888' }} dy={10} />
                  <Tooltip 
                    formatter={(val: any) => formatRupiah(val)} 
                    contentStyle={{ borderRadius: '12px', borderColor: '#e5e7eb', fontSize: '13px' }}
                  />
                  <Area type="monotone" name="Pemasukan" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                  <Area type="monotone" name="Pengeluaran" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Kategori Pengeluaran */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Pengeluaran Bulan Ini</h2>
          </div>
          <div className="h-[250px] w-full flex items-center justify-center">
            {loading ? (
              <div className="text-sm text-muted-foreground">Memuat Grafik...</div>
            ) : pieData.length === 0 ? (
              <div className="text-sm text-muted-foreground">Belum ada pengeluaran</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip 
                    formatter={(val: any) => formatRupiah(val)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '13px' }}
                  />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Transaksi Terbaru */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Transaksi Terbaru</h2>
            <button
              onClick={() => router.push("/transaksi")}
              className="text-xs text-primary hover:underline cursor-pointer"
            >
              Lihat semua →
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Belum ada transaksi</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {recent.map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="text-sm font-medium text-foreground">{t.note || t.category}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{formatDate(t.date)}</div>
                  </div>
                  <div className={`text-sm font-bold ${t.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                    {t.type === "income" ? "+" : "−"}{formatRupiah(t.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hutang & Piutang */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Hutang & Piutang</h2>
            <button
              onClick={() => router.push("/hutang")}
              className="text-xs text-primary hover:underline cursor-pointer"
            >
              Kelola →
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Memuat...</p>
          ) : debts.filter((d) => !d.isPaid).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Tidak ada hutang aktif</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {debts.filter((d) => !d.isPaid).slice(0, 4).map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="text-sm font-medium text-foreground">{d.name}</div>
                    <div className={`text-xs mt-0.5 ${d.type === "owe" ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {d.type === "owe" ? "Hutang" : "Piutang"}
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${d.type === "owe" ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {formatRupiah(d.amount)}
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