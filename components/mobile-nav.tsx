"use client"

import { usePathname, useRouter } from "next/navigation"

const navItems = [
  {
    href: "/dashboard",
    label: "Home",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/transaksi",
    label: "Transaksi",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    href: "/hutang",
    label: "Hutang",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    href: "/anggaran",
    label: "Limit",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" strokeDasharray="4 4" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
  {
    href: "/dompet",
    label: "Dompet",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
]

export function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 pb-6 pt-2">
      <nav className="bg-sidebar border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center justify-around p-1 overflow-hidden">
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex flex-col items-center gap-1 flex-1 py-2 px-1 transition-all duration-300 relative
                ${active ? "text-primary" : "text-sidebar-foreground/50 hover:text-sidebar-foreground"}`}
            >
              {active && (
                <div className="absolute top-0 left-1/4 right-1/4 h-1 bg-primary rounded-b-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              )}
              <div className={`transition-transform duration-300 ${active ? "scale-110 -translate-y-0.5" : ""}`}>
                {item.icon}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
