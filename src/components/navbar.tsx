'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCart } from '@/components/cart-context'
import { ShoppingBag, Menu, X, ArrowUpRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export default function Navbar() {
  const { totalItems } = useCart()
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    if (pathname === '/') {
      e.preventDefault()
      const element = document.getElementById(targetId)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
      setIsOpen(false)
    } else {
      // If we are on another page, navigate to home and scroll to target
      router.push(`/#${targetId}`)
      setIsOpen(false)
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-black/90 backdrop-blur-md border-b border-white/5 py-4'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 overflow-hidden rounded-lg border border-brand-gold/30 group-hover:border-brand-gold transition-colors duration-300">
            <Image
              src="/logo2.png"
              alt="Visão Importados"
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-title text-lg tracking-wider text-white group-hover:text-brand-gold transition-colors duration-300">
              VISÃO IMPORTADOS
            </span>
            <span className="text-[9px] font-sans tracking-widest text-brand-silver uppercase">
              Exclusividade & Luxo
            </span>
          </div>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            onClick={(e) => handleNavClick(e, 'home')}
            className="text-sm font-sans tracking-wide text-brand-white hover:text-brand-gold hover:tracking-widest transition-all duration-300"
          >
            Início
          </Link>
          <Link
            href="/catalogo"
            className={`text-sm font-sans tracking-wide hover:text-brand-gold transition-colors duration-300 ${
              pathname === '/catalogo' ? 'text-brand-gold font-medium' : 'text-brand-white'
            }`}
          >
            Catálogo
          </Link>
          <Link
            href="/#cotacao"
            onClick={(e) => handleNavClick(e, 'cotacao')}
            className="text-sm font-sans tracking-wide text-brand-white hover:text-brand-gold transition-colors duration-300"
          >
            Sob Demanda
          </Link>
          <Link
            href="/#sobre"
            onClick={(e) => handleNavClick(e, 'sobre')}
            className="text-sm font-sans tracking-wide text-brand-white hover:text-brand-gold transition-colors duration-300"
          >
            Sobre Nós
          </Link>
          <Link
            href="/#contato"
            onClick={(e) => handleNavClick(e, 'contato')}
            className="text-sm font-sans tracking-wide text-brand-white hover:text-brand-gold transition-colors duration-300"
          >
            Contato
          </Link>
        </nav>

        {/* ACTIONS */}
        <div className="flex items-center gap-4">
          <Link
            href="/carrinho"
            className="relative p-2.5 text-white hover:text-brand-gold transition-colors duration-300 rounded-full bg-white/5 border border-white/10 hover:border-brand-gold/30"
          >
            <ShoppingBag className="w-5 h-5" />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 bg-brand-gold text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center font-sans"
                >
                  {totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          <Link
            href="/catalogo"
            className="hidden sm:flex items-center gap-1.5 px-5 py-2.5 bg-gold-gradient text-black font-sans text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 transition-all duration-300"
          >
            Ver Catálogo
            <ArrowUpRight className="w-4 h-4" />
          </Link>

          {/* MOBILE TOGGLE */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-white hover:text-brand-gold transition-colors duration-300 bg-white/5 rounded border border-white/10"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden w-full bg-brand-black border-b border-white/5 overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              <Link
                href="/"
                onClick={(e) => handleNavClick(e, 'home')}
                className="text-base font-sans tracking-wide text-brand-white hover:text-brand-gold transition-colors"
              >
                Início
              </Link>
              <Link
                href="/catalogo"
                onClick={() => setIsOpen(false)}
                className="text-base font-sans tracking-wide text-brand-white hover:text-brand-gold transition-colors"
              >
                Catálogo
              </Link>
              <Link
                href="/#cotacao"
                onClick={(e) => handleNavClick(e, 'cotacao')}
                className="text-base font-sans tracking-wide text-brand-white hover:text-brand-gold transition-colors"
              >
                Sob Demanda
              </Link>
              <Link
                href="/#sobre"
                onClick={(e) => handleNavClick(e, 'sobre')}
                className="text-base font-sans tracking-wide text-brand-white hover:text-brand-gold transition-colors"
              >
                Sobre Nós
              </Link>
              <Link
                href="/#contato"
                onClick={(e) => handleNavClick(e, 'contato')}
                className="text-base font-sans tracking-wide text-brand-white hover:text-brand-gold transition-colors"
              >
                Contato
              </Link>
              <Link
                href="/catalogo"
                className="w-full flex items-center justify-center gap-1.5 py-3 bg-brand-gold text-black font-sans text-xs font-bold uppercase tracking-wider rounded"
              >
                Ver Catálogo
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
