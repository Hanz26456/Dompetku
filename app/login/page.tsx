"use client"

import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { ThemeToggle } from "@/components/ThemeToggle"

export default function LoginPage() {
  const { status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard")
    }
  }, [status, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {/* Theme toggle top-right */}
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-sm p-8 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            ₽
          </div>
          <span className="text-2xl font-bold text-foreground tracking-tight">
            Dompet<span className="text-primary">ku</span>
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-8">
          Catatan keuangan keluarga
        </p>

        <button
          id="google-signin-btn"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border bg-secondary hover:bg-accent text-foreground font-medium text-sm cursor-pointer transition-all duration-200 hover:shadow-sm"
        >
          <img src="https://www.google.com/favicon.ico" width="18" height="18" alt="Google" />
          Masuk dengan Google
        </button>

        <p className="mt-6 text-xs text-muted-foreground">
          Dengan masuk, kamu menyetujui penggunaan data untuk keperluan pencatatan keuangan pribadi.
        </p>
      </div>
    </div>
  )
}