"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { formatRupiah } from "@/lib/types"

export function AiChatAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Halo! Saya asisten Dompetku. Ada yang bisa saya bantu dengan keuangan kamu hari ini?" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return

    const userText = input
    setInput("")
    setMessages(prev => [...prev, { role: "user", text: userText }])
    setLoading(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userText })
      })
      const data = await res.json()
      
      if (data.error) {
        setMessages(prev => [...prev, { role: "ai", text: "Maaf, terjadi kesalahan saat menghubungi server AI." }])
      } else {
        setMessages(prev => [...prev, { role: "ai", text: data.response }])
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "ai", text: "Maaf, jaringan bermasalah. Coba lagi ya." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-2xl shadow-2xl z-50 flex items-center justify-center cursor-pointer group"
      >
        <div className="absolute inset-0 bg-primary/20 rounded-2xl animate-ping group-hover:hidden" />
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
        </svg>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 w-[350px] md:w-[400px] h-[500px] bg-card border border-border shadow-2xl rounded-3xl z-50 flex flex-col overflow-hidden backdrop-blur-sm"
          >
            {/* Header */}
            <div className="p-5 bg-primary text-primary-foreground flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">Asisten Keuangan</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">Gemini 1.5 Powered</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:opacity-70">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar"
            >
              {messages.map((m, i) => (
                <div 
                  key={i} 
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-medium leading-relaxed
                    ${m.role === "user" 
                      ? "bg-primary text-primary-foreground rounded-tr-none shadow-md" 
                      : "bg-secondary text-foreground rounded-tl-none border border-border/40"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-secondary p-3.5 rounded-2xl rounded-tl-none border border-border/40 flex gap-1">
                    <div className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-bounce" />
                    <div className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-bounce delay-75" />
                    <div className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-bounce delay-150" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border/40 bg-secondary/30">
              <div className="flex gap-2">
                <input 
                  className="flex-1 bg-background border border-border px-4 py-2.5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Tanyakan sesuatu..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <button 
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-primary/20"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="rotate-45 ml-[-2px] mt-[-1px]"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
