'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ShieldAlert, KeyRound, Loader2, CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // O Supabase SDK irá capturar o hash na URL e autenticar o usuário
  // Se o usuário não tiver um token válido na URL, ele não estará autenticado e o update dará erro.

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    
    if (password !== confirmPassword) {
      setErrorMsg('As senhas não coincidem.')
      return
    }

    if (password.length < 6) {
      setErrorMsg('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setErrorMsg('Erro ao atualizar a senha. O link pode ter expirado.')
        setLoading(false)
        return
      }

      setSuccessMsg('Senha atualizada com sucesso! Redirecionando...')
      
      // Espera uns segundos e redireciona para o login do admin
      setTimeout(() => {
        router.push('/admin/login')
      }, 2500)

    } catch (err) {
      console.error(err)
      setErrorMsg('Erro inesperado ao redefinir a senha.')
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
        
        <h1 className="font-title text-xl text-white uppercase tracking-wider mb-2">Redefinir Senha</h1>
        <p className="font-sans text-[10px] text-brand-silver uppercase tracking-widest mb-8 text-center">
          Digite a sua nova senha de acesso
        </p>

        {errorMsg && (
          <div className="w-full p-4 mb-6 bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-sans rounded flex items-center gap-3">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="w-full p-4 mb-6 bg-green-950/40 border border-green-500/20 text-green-400 text-xs font-sans rounded flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleResetPassword} className="w-full space-y-6">
          <div>
            <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-2">Nova Senha</label>
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

          <div>
            <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-2">Confirmar Nova Senha</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-brand-silver absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black border border-white/10 rounded px-11 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !!successMsg}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gold-gradient text-black font-sans font-bold text-xs uppercase tracking-widest rounded hover:opacity-90 transition-all duration-300 disabled:opacity-50"
          >
            {loading ? (
               <>
                 <Loader2 className="w-4 h-4 animate-spin" />
                 Atualizando...
               </>
            ) : (
               'Redefinir Senha'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
