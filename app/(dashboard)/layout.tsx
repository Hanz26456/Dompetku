"use client"

import { useSession, signOut } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { AiChatAssistant } from "@/components/ai-chat-assistant"
import { MobileNav } from "@/components/mobile-nav"

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/transaksi",
    label: "Transaksi",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    href: "/hutang",
    label: "Hutang & Piutang",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    href: "/laporan",
    label: "Laporan",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
      </svg>
    ),
  },
  {
    href: "/anggaran",
    label: "Anggaran",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        <rect x="2" y="2" width="20" height="20" rx="5" strokeDasharray="4 4" />
      </svg>
    ),
  },
  {
    href: "/dompet",
    label: "Dompet",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  {
    href: "/tabungan",
    label: "Target",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Memuat...
        </div>
      </div>
    )
  }

  const initials = session?.user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "U"

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-sidebar flex-col sticky top-0 h-screen overflow-hidden border-r border-white/5">
        {/* Logo */}
        <div className="px-6 py-8">
          <div className="flex flex-col">
            <span className="text-2xl font-bold tracking-tight text-white flex items-baseline gap-0.5">
              Dompet<span className="font-serif italic text-primary/90">ku</span>
            </span>
            <div className="text-[9px] text-sidebar-foreground mt-1 uppercase tracking-[0.2em] font-bold opacity-50">
              Keuangan Keluarga
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
          {/* MENU Group */}
          <div className="mb-6">
            <div className="px-4 mb-3 text-[10px] font-black text-sidebar-foreground/30 uppercase tracking-widest">
              Menu
            </div>
            <nav className="flex flex-col gap-0.5">
              {navItems.slice(0, 5).map((item) => {
                const active = pathname === item.href
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all duration-200 text-left relative group
                      ${active
                        ? "bg-white/10 text-white"
                        : "text-sidebar-foreground hover:bg-white/5 hover:text-sidebar-accent-foreground"
                      }`}
                  >
                    {active && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-r-full" />}
                    <span className={`${active ? "text-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"}`}>
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* DOMPET Group */}
          <div>
            <div className="px-4 mb-3 text-[10px] font-black text-sidebar-foreground/30 uppercase tracking-widest">
              Dompet
            </div>
            <nav className="flex flex-col gap-0.5">
              {navItems.slice(5).map((item) => {
                const active = pathname === item.href
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all duration-200 text-left relative group
                      ${active
                        ? "bg-white/10 text-white"
                        : "text-sidebar-foreground hover:bg-white/5 hover:text-sidebar-accent-foreground"
                      }`}
                  >
                    {active && <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-r-full" />}
                    <span className={`${active ? "text-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"}`}>
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Footer: user + theme toggle */}
        <div className="p-4 bg-black/20">
          <div className="flex items-center justify-between bg-sidebar-border/30 p-2 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-orange-700 flex items-center justify-center text-white text-xs font-black shadow-lg">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate max-w-[80px]">
                  {session?.user?.name ?? "User"}
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-[10px] text-orange-500 font-bold hover:text-orange-400 transition-colors cursor-pointer"
                >
                  Keluar
                </button>
              </div>
            </div>
            <div className="opacity-60 scale-90">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 h-screen overflow-y-auto bg-background selection:bg-primary/20 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/40">
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight flex items-baseline gap-0.5">
              Dompet<span className="font-serif italic text-primary/90">ku</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="w-8 h-8 rounded-lg bg-orange-700/80 flex items-center justify-center text-white text-[10px] font-black shadow-inner">
              {initials}
            </div>
          </div>
        </header>

        <div className="max-w-[1280px] mx-auto p-4 lg:p-6 w-full pb-24 lg:pb-6">
          {children}
        </div>
        <AiChatAssistant />
        <MobileNav />
      </main>
    </div>
  )
}