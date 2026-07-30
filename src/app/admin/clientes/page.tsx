'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Users, Loader2, Check, X } from 'lucide-react'

interface Customer {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  created_at: string
}

export default function AdminClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  // Add customer form state
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  // Edit customer form state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true })
      if (data) setCustomers(data)
    } catch (err) {
      console.error('Error fetching customers:', err)
    } finally {
      setLoading(false)
    }
  }

  // --- CRUD ---
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setAddLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{ 
          name: newName.trim(), 
          phone: newPhone.trim() || null, 
          email: newEmail.trim() || null 
        }])
        .select()
        
      if (error) { 
        alert('Erro ao criar cliente. Talvez já exista um com este nome.')
        setAddLoading(false)
        return 
      }
      
      if (data) {
        setCustomers((prev) => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)))
        setNewName('')
        setNewPhone('')
        setNewEmail('')
      }
    } catch (err) { 
      console.error(err) 
    } finally { 
      setAddLoading(false) 
    }
  }

  const handleStartEdit = (cat: Customer) => {
    setEditingId(cat.id)
    setEditName(cat.name)
    setEditPhone(cat.phone || '')
    setEditEmail(cat.email || '')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditPhone('')
    setEditEmail('')
  }

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return
    setEditLoading(true)
    try {
      const { error } = await supabase
        .from('customers')
        .update({ 
          name: editName.trim(), 
          phone: editPhone.trim() || null, 
          email: editEmail.trim() || null 
        })
        .eq('id', id)
        
      if (error) { 
        alert('Erro ao editar cliente.')
        setEditLoading(false)
        return 
      }
      
      setCustomers((prev) =>
        prev.map((c) => c.id === id ? { ...c, name: editName.trim(), phone: editPhone.trim() || null, email: editEmail.trim() || null } : c)
          .sort((a, b) => a.name.localeCompare(b.name))
      )
      handleCancelEdit()
    } catch (err) { 
      console.error(err) 
    } finally { 
      setEditLoading(false) 
    }
  }

  const handleDeleteCustomer = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cliente "${name}"?\nIsso poderá deixar movimentações órfãs se não houver CASCADE.`)) return
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id)
      if (error) { 
        alert('Erro ao excluir cliente. Verifique dependências.')
        return 
      }
      setCustomers((prev) => prev.filter((c) => c.id !== id))
    } catch (err) { 
      console.error(err) 
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-title text-2xl sm:text-3xl text-white uppercase tracking-wide">Clientes</h1>
        <p className="font-sans text-sm text-slate-300 mt-1">Gerencie a base de clientes e seus dados de contato</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* ADD FORM */}
        <div className="p-6 bg-brand-black border border-white/10 rounded-lg">
          <h3 className="font-title text-sm text-white uppercase tracking-wider mb-6 flex items-center gap-2 font-bold">
            <Users className="w-4 h-4 text-brand-gold" />
            Novo Cliente
          </h3>
          <form onSubmit={handleAddCustomer} className="space-y-5">
            <div>
              <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-2">Nome do Cliente *</label>
              <input
                type="text" required value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-gold text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-2">Telefone <span className="text-slate-400 normal-case font-normal">(opcional)</span></label>
              <input
                type="text" value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Ex: (11) 99999-9999"
                className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-gold text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-2">Email <span className="text-slate-400 normal-case font-normal">(opcional)</span></label>
              <input
                type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Ex: joao@email.com"
                className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-gold text-white"
              />
            </div>

            <button
              type="submit" disabled={addLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-gold text-black font-sans text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 transition-all duration-300 disabled:opacity-50"
            >
              {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Adicionar Cliente
            </button>
          </form>
        </div>

        {/* LIST */}
        <div className="lg:col-span-2 p-6 bg-brand-black border border-white/10 rounded-lg">
          <h3 className="font-title text-sm text-white uppercase tracking-wider mb-6 font-bold">Clientes Cadastrados</h3>

          {loading ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-gold mx-auto" />
            </div>
          ) : customers.length === 0 ? (
            <p className="text-sm font-sans text-slate-300 py-6">Nenhum cliente cadastrado.</p>
          ) : (
            <div className="space-y-2">
              {customers.map((cat) => (
                <div
                  key={cat.id}
                  className={`border rounded-lg transition-colors ${editingId === cat.id ? 'border-brand-gold/40 bg-brand-gold/5' : 'border-white/10 bg-black/30 hover:bg-white/5'}`}
                >
                  {editingId === cat.id ? (
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-1.5">Nome</label>
                          <input
                            type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-gold text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-1.5">Telefone</label>
                          <input
                            type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-gold text-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-1.5">Email</label>
                          <input
                            type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                            className="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-gold text-white"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2 pt-1 border-t border-white/10">
                        <button
                          type="button" onClick={() => handleSaveEdit(cat.id)} disabled={editLoading}
                          className="px-4 py-2 text-sm text-green-400 hover:text-green-300 bg-green-950/40 border border-green-500/30 rounded flex items-center gap-2 font-bold"
                        >
                          {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Salvar
                        </button>
                        <button
                          type="button" onClick={handleCancelEdit}
                          className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-white/10 border border-white/15 rounded flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-sm font-semibold text-white truncate">{cat.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {cat.phone && <p className="text-xs text-slate-400">{cat.phone}</p>}
                          {cat.email && <p className="text-xs text-slate-400">{cat.email}</p>}
                          {!cat.phone && !cat.email && <p className="text-xs text-slate-500 italic">Sem contato registrado</p>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => handleStartEdit(cat)} className="p-2 text-white hover:text-brand-gold bg-white/5 border border-white/10 hover:border-brand-gold/40 rounded transition-colors" title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteCustomer(cat.id, cat.name)} className="p-2 text-slate-300 hover:text-red-400 bg-white/5 border border-white/10 hover:border-red-500/30 rounded transition-colors" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
