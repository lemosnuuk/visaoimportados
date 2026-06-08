'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  LayoutDashboard, 
  Tag, 
  Package, 
  LogOut, 
  Globe, 
  Menu, 
  X, 
  ShieldCheck 
} from 'lucide-react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Skip layout styling if we are on the login page
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/admin/login')
      router.refresh()
    } catch (err) {
      console.error('Logout error', err)
    }
  }

  const navLinks = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/produtos', label: 'Produtos', icon: Package },
    { href: '/admin/categorias', label: 'Categorias', icon: Tag },
  ]

  const isLinkActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="bg-black min-h-screen text-foreground flex flex-col md:flex-row">
      {/* MOBILE HEADER */}
      <header className="md:hidden w-full bg-brand-black border-b border-white/5 px-6 py-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded overflow-hidden border border-brand-gold/30">
            <Image
              src="/logo2.png"
              alt="Visão Importados"
              fill
              className="object-cover"
            />
          </div>
          <span className="font-title text-sm tracking-wider text-white">VISÃO ADMIN</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-white hover:text-brand-gold bg-white/5 rounded border border-white/10"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[65px] bg-black/95 z-30 flex flex-col px-6 py-8 gap-6 border-t border-white/5">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => {
              const Icon = link.icon
              const active = isLinkActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 py-3 px-4 rounded text-sm font-sans tracking-wide transition-all ${
                    active 
                      ? 'bg-brand-gold text-black font-bold' 
                      : 'text-brand-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-white/5 pt-6 flex flex-col gap-4 mt-auto">
            <Link
              href="/"
              className="flex items-center gap-3 py-3 px-4 text-xs font-sans text-brand-silver hover:text-white"
            >
              <Globe className="w-4 h-4" />
              Ir para o site
            </Link>
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                handleLogout()
              }}
              className="flex items-center gap-3 py-3 px-4 text-xs font-sans text-red-400 hover:text-red-300"
            >
              <LogOut className="w-4 h-4" />
              Sair do Painel
            </button>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-72 bg-brand-black border-r border-white/5 p-8 shrink-0">
        {/* LOGO */}
        <div className="flex items-center gap-4 mb-10">
          <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-brand-gold/30">
            <Image
              src="/logo2.png"
              alt="Visão Importados"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-title text-sm tracking-wider text-white">VISÃO IMPORTADOS</span>
            <span className="text-[8px] font-sans tracking-widest text-brand-gold uppercase flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              PAINEL ADMIN
            </span>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex flex-col gap-2 flex-grow">
          {navLinks.map((link) => {
            const Icon = link.icon
            const active = isLinkActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 py-3 px-4 rounded text-xs font-sans uppercase tracking-widest transition-all ${
                  active
                    ? 'bg-brand-gold text-black font-bold shadow-lg shadow-brand-gold/10'
                    : 'text-brand-white hover:bg-white/5 hover:text-brand-gold'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* SIDEBAR FOOTER */}
        <div className="border-t border-white/5 pt-6 flex flex-col gap-2 mt-auto">
          <Link
            href="/"
            className="flex items-center gap-3 py-3 px-4 text-xs font-sans text-brand-silver hover:text-white"
          >
            <Globe className="w-4 h-4 shrink-0" />
            Visualizar Site
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 py-3 px-4 text-xs font-sans text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT VIEWPORT */}
      <main className="flex-grow p-6 md:p-12 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
