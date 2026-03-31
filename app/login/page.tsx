"use client"

import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { motion, AnimatePresence } from "framer-motion"
import { LogIn, ReceiptText, ShieldCheck, Sparkles } from "lucide-react"

export default function LoginPage() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 relative overflow-hidden theme-transition">
      {/* Decorative Animated Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />

      {/* Theme toggle top-right */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="fixed top-6 right-6 z-50 bg-secondary/80 backdrop-blur-md rounded-full p-1 border border-border/50 shadow-sm"
      >
        <ThemeToggle />
      </motion.div>

      {/* Main Content */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-card/40 backdrop-blur-2xl border border-white/10 dark:border-white/5 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] p-10 md:p-12 text-center relative overflow-hidden group transition-all duration-500 hover:shadow-[0_48px_80px_-24px_rgba(0,0,0,0.12)]">
          {/* Subtle Glow Hover Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* Logo Section */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col items-center gap-4 mb-10"
          >
            <div className="relative group/logo">
              <div className="absolute inset-0 bg-primary/20 blur-xl group-hover/logo:bg-primary/30 transition-all rounded-full" />
              <div className="relative w-16 h-16 rounded-[1.5rem] bg-linear-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-xl transform rotate-3 group-hover/logo:rotate-0 transition-transform duration-300">
                <ReceiptText className="w-8 h-8" />
              </div>
              <motion.div 
                animate={{ rotate: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="absolute -top-1 -right-1"
              >
                <div className="bg-accent text-accent-foreground p-1 rounded-full shadow-sm">
                  <Sparkles className="w-3 h-3" />
                </div>
              </motion.div>
            </div>
            <div>
              <h1 className="text-4xl font-serif font-black text-foreground tracking-tight mb-1">
                Dompet<span className="text-primary italic">ku</span>
              </h1>
              <p className="text-sm font-medium text-muted-foreground/80 tracking-wide uppercase">
                Premium Finance Assistant
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Selamat Datang</h2>
              <p className="text-muted-foreground leading-relaxed max-w-[280px] mx-auto text-sm">
                Catat setiap receh, rencanakan setiap rupiah. Kelola keuangan keluarga dengan elegan.
              </p>
            </div>

            <button
              id="google-signin-btn"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="group/btn relative w-full flex items-center justify-center gap-4 px-6 py-4 rounded-2xl border border-border/50 bg-secondary/80 hover:bg-secondary text-foreground font-semibold text-base cursor-pointer overflow-hidden transition-all duration-300 shadow-sm active:scale-[0.98]"
            >
              <div className="absolute inset-0 w-full h-full bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
              <img src="https://www.google.com/favicon.ico" width="20" height="20" alt="Google" className="drop-shadow-sm" />
              <span>Masuk dengan Google</span>
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3 text-primary/60" />
              Sistem Keamanan Terenkripsi
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-xs text-muted-foreground/60 text-center font-medium"
        >
          &copy; 2026 Dompetku.
        </motion.p>
      </motion.div>
    </div>
  )
}