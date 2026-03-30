import type { Metadata, Viewport } from "next"
import SessionWrapper from "@/components/SessionWrapper"
import { ThemeProvider } from "@/components/ThemeProvider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Dompetku",
  description: "Catatan keuangan keluarga",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dompetku",
  },
}

export const viewport: Viewport = {
  themeColor: "#10b981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <SessionWrapper>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </SessionWrapper>
      </body>
    </html>
  )
}