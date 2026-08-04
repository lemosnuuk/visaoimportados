'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Mail, Phone, MapPin, ShieldAlert } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-black border-t border-white/5 pt-16 pb-8 text-brand-silver">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
        {/* BRAND COLUMN */}
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-brand-gold/30">
              <Image
                src="/logo2.png"
                alt="Visão Importados"
                fill
                className="object-cover"
              />
            </div>
            <span className="font-title text-base tracking-wider text-white">
              VISÃO IMPORTADOS
            </span>
          </Link>
          <p className="text-xs font-sans italic leading-relaxed text-brand-silver">
            &ldquo;Enxergando além. Importando o extraordinário.&rdquo;
          </p>
          <p className="text-xs font-sans leading-relaxed text-brand-silver/70">
            Plataforma de catálogo inteligente premium. Escolha os itens de sua preferência e faça seu pedido direto pelo WhatsApp para um atendimento personalizado de alto nível.
          </p>
        </div>

        {/* NAVIGATION COLUMN */}
        <div className="flex flex-col gap-4">
          <h4 className="font-title text-sm uppercase tracking-widest text-white">Navegação</h4>
          <ul className="flex flex-col gap-2 text-xs font-sans">
            <li>
              <Link href="/" className="hover:text-brand-gold transition-colors">Início</Link>
            </li>
            <li>
              <Link href="/catalogo" className="hover:text-brand-gold transition-colors">Catálogo Completo</Link>
            </li>
            <li>
              <Link href="/#cotacao" className="hover:text-brand-gold transition-colors">Importação sob Demanda</Link>
            </li>
            <li>
              <Link href="/#sobre" className="hover:text-brand-gold transition-colors">Sobre a Empresa</Link>
            </li>
          </ul>
        </div>

        {/* VALUES COLUMN */}
        <div className="flex flex-col gap-4">
          <h4 className="font-title text-sm uppercase tracking-widest text-white">Valores da Marca</h4>
          <ul className="flex flex-col gap-2 text-xs font-sans">
            <li className="flex items-center gap-2">
              <span className="text-brand-gold font-bold">✓</span> Excelência
            </li>
            <li className="flex items-center gap-2">
              <span className="text-brand-gold font-bold">✓</span> Confiança & Procedência
            </li>
            <li className="flex items-center gap-2">
              <span className="text-brand-gold font-bold">✓</span> Exclusividade
            </li>
            <li className="flex items-center gap-2">
              <span className="text-brand-gold font-bold">✓</span> Tecnologia de Ponta
            </li>
          </ul>
        </div>

        {/* CONTACT COLUMN */}
        <div className="flex flex-col gap-4">
          <h4 className="font-title text-sm uppercase tracking-widest text-white">Contato</h4>
          <ul className="flex flex-col gap-3 text-xs font-sans">
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-brand-gold shrink-0" />
              <span>(18) 99719-0799</span>
            </li>
            <li className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-brand-gold shrink-0" />
              <a href="https://instagram.com/visaoimportados" target="_blank" rel="noopener noreferrer" className="hover:text-brand-gold">@visaoimportados</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-brand-gold shrink-0" />
              <a href="mailto:visaodigitalnuvem@gmail.com" className="hover:text-brand-gold">visaodigitalnuvem@gmail.com</a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-gold shrink-0" />
              <span>Importação & Distribuição Nacional</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-[10px] font-sans text-brand-silver/50">
          &copy; {currentYear} VISÃO IMPORTADOS. Todos os direitos reservados.
        </span>

        {/* Subtle Admin Link */}
        <Link 
          href="/admin" 
          className="flex items-center gap-1 text-[10px] font-sans text-brand-silver/30 hover:text-brand-gold transition-colors"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          Acesso Administrativo
        </Link>
      </div>
    </footer>
  )
}
