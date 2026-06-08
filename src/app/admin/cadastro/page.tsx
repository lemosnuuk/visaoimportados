'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, ShieldAlert, KeyRound, Mail, Loader2, ArrowLeft } from 'lucide-react'

export default function AdminCadastroPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        setErrorMsg(`Erro ao cadastrar: ${error.message}`)
        setLoading(false)
        return
      }

      setSuccessMsg('Cadastro realizado com sucesso! Se a confirmação de e-mail estiver ativa no seu Supabase, você precisará confirmar o e-mail na sua caixa de entrada antes de logar.')
      setEmail('')
      setPassword('')
      setLoading(false)
    } catch (err) {
      console.error(err)
      setErrorMsg('Erro inesperado ao realizar o cadastro.')
      setLoading(false)
    }
  }

  return (
    <div className="bg-black min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md p-8 bg-brand-black border border-white/5 rounded-lg gold-glow flex flex-col items-center">
        {/* LOGO */}
        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-brand-gold/30 mb-4">
          <Image
            src="/logo2.png"
            alt="Visão Importados"
            fill
            className="object-cover"
          />
        </div>
        
        <h1 className="font-title text-xl text-white uppercase tracking-wider mb-2">Criar Administrador</h1>
        <p className="font-sans text-[10px] text-brand-silver uppercase tracking-widest mb-8">Administração Visão Importados</p>

        {errorMsg && (
          <div className="w-full p-4 mb-6 bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-sans rounded flex items-center gap-3">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="w-full p-4 mb-6 bg-green-950/40 border border-green-500/20 text-green-400 text-xs font-sans rounded flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleCadastro} className="w-full space-y-6">
          <div>
            <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-2">E-mail Administrativo</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-brand-silver absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@visaoimportados.com"
                className="w-full bg-black border border-white/10 rounded px-11 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-2">Senha de Acesso</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-brand-silver absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black border border-white/10 rounded px-11 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gold-gradient text-black font-sans font-bold text-xs uppercase tracking-widest rounded hover:opacity-90 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Cadastrando...
              </>
            ) : (
              'Cadastrar Administrador'
            )}
          </button>
        </form>

        <div className="w-full mt-6 pt-6 border-t border-white/5">
          <Link
            href="/admin/login"
            className="flex items-center justify-center gap-2 text-[10px] font-sans text-brand-silver hover:text-brand-gold uppercase tracking-widest transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o Login
          </Link>
        </div>
      </div>
    </div>
  )
}
