'use client'

import React, { useState, useEffect } from 'react'
import { AlertTriangle, Clock, Server, ShieldAlert } from 'lucide-react'

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

export function HostingAlertBanner() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const calculateTimeLeft = (): TimeLeft => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()

      // Set target to the 30th of current month at 23:59:59
      let targetDate = new Date(year, month, 30, 23, 59, 59)

      // If today is past the 30th at 23:59:59, set target to 30th of next month
      if (now.getTime() > targetDate.getTime()) {
        targetDate = new Date(year, month + 1, 30, 23, 59, 59)
      }

      const diff = targetDate.getTime() - now.getTime()

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
      const minutes = Math.floor((diff / 1000 / 60) % 60)
      const seconds = Math.floor((diff / 1000) % 60)

      return { days, hours, minutes, seconds, isExpired: false }
    }

    setTimeLeft(calculateTimeLeft())

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  if (!mounted) {
    return null
  }

  const formatNumber = (num: number) => String(num).padStart(2, '0')

  return (
    <div className="w-full bg-gradient-to-r from-red-950 via-red-900 to-amber-950 text-white border-b-2 border-red-500/50 shadow-2xl relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-col lg:flex-row items-center justify-between gap-3 relative z-10">
        
        {/* Left Side: Alert Icon & Text */}
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="p-2.5 bg-red-500/20 border border-red-500/40 rounded-xl shrink-0 animate-pulse text-red-400">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-red-300 flex items-center gap-1">
                <Server className="w-4 h-4 inline" /> AVISO DE MANUTENÇÃO & SERVIDOR
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-500/30 text-red-200 border border-red-400/30">
                PENDENTE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 mt-0.5 leading-snug">
              A taxa de renovação da hospedagem mensal e banco de dados vence dia <strong className="text-white underline decoration-red-400">30</strong>. Efetue a regularização para evitar a suspensão temporária do sistema.
            </p>
          </div>
        </div>

        {/* Right Side: Countdown Timer */}
        <div className="flex items-center gap-2 shrink-0 bg-black/40 border border-red-500/30 px-3.5 py-2 rounded-xl backdrop-blur-md">
          <Clock className="w-4 h-4 text-red-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-xs font-semibold uppercase text-slate-300 tracking-wider mr-1 hidden sm:inline">
            Expira em:
          </span>
          
          <div className="flex items-center gap-1 font-mono font-bold text-xs sm:text-sm">
            <div className="flex flex-col items-center bg-red-950/80 border border-red-500/40 rounded px-2 py-1 min-w-[34px]">
              <span className="text-red-200">{formatNumber(timeLeft.days)}</span>
              <span className="text-[9px] font-sans text-red-400 font-normal uppercase">dias</span>
            </div>
            <span className="text-red-400 font-bold">:</span>
            <div className="flex flex-col items-center bg-red-950/80 border border-red-500/40 rounded px-2 py-1 min-w-[34px]">
              <span className="text-red-200">{formatNumber(timeLeft.hours)}</span>
              <span className="text-[9px] font-sans text-red-400 font-normal uppercase">hrs</span>
            </div>
            <span className="text-red-400 font-bold">:</span>
            <div className="flex flex-col items-center bg-red-950/80 border border-red-500/40 rounded px-2 py-1 min-w-[34px]">
              <span className="text-red-200">{formatNumber(timeLeft.minutes)}</span>
              <span className="text-[9px] font-sans text-red-400 font-normal uppercase">min</span>
            </div>
            <span className="text-red-400 font-bold">:</span>
            <div className="flex flex-col items-center bg-red-900 border border-red-400 rounded px-2 py-1 min-w-[34px] animate-pulse">
              <span className="text-white">{formatNumber(timeLeft.seconds)}</span>
              <span className="text-[9px] font-sans text-red-300 font-normal uppercase">seg</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
