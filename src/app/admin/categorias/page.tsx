'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Tag, Loader2, Check, X } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
}

export default function AdminCategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Add category form state
  const [newName, setNewName] = useState('')
  const [addLoading, setAddLoading] = useState(false)

  // Edit category form state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

      if (data) {
        setCategories(data)
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
    } finally {
      setLoading(false)
    }
  }

  // Slug generator helper
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    setAddLoading(true)
    const slug = generateSlug(newName)

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: newName.trim(), slug }])
        .select()

      if (error) {
        alert('Erro ao criar categoria. Talvez ela já exista (slug duplicado).')
        setAddLoading(false)
        return
      }

      if (data) {
        setCategories((prev) => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)))
        setNewName('')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAddLoading(false)
    }
  }

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id)
    setEditName(cat.name)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return
    setEditLoading(true)
    const slug = generateSlug(editName)

    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: editName.trim(), slug })
        .eq('id', id)

      if (error) {
        alert('Erro ao editar categoria.')
        setEditLoading(false)
        return
      }

      setCategories((prev) =>
        prev
          .map((cat) => (cat.id === id ? { ...cat, name: editName.trim(), slug } : cat))
          .sort((a, b) => a.name.localeCompare(b.name))
      )
      setEditingId(null)
      setEditName('')
    } catch (err) {
      console.error(err)
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${name}"?\nIsso poderá desassociar produtos desta categoria.`)) return

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) {
        alert('Erro ao excluir categoria.')
        return
      }

      setCategories((prev) => prev.filter((cat) => cat.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <div>
        <h1 className="font-title text-2xl sm:text-3xl text-white uppercase tracking-wide">Categorias</h1>
        <p className="font-sans text-sm text-slate-300 mt-1">Gerencie as categorias de importados disponíveis na vitrine</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* ADD CATEGORY FORM */}
        <div className="p-6 bg-brand-black border border-white/10 rounded-lg">
          <h3 className="font-title text-sm text-white uppercase tracking-wider mb-6 flex items-center gap-2 font-bold">
            <Tag className="w-4 h-4 text-brand-gold" />
            Nova Categoria
          </h3>
          <form onSubmit={handleAddCategory} className="space-y-5">
            <div>
              <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-2">Nome da Categoria</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Óculos de Sol, Relógios"
                className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-gold text-white"
              />
            </div>

            <button
              type="submit"
              disabled={addLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-gold text-black font-sans text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 transition-all duration-300 disabled:opacity-50 shadow-md shadow-brand-gold/10"
            >
              {addLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Adicionar Categoria
            </button>
          </form>
        </div>

        {/* LIST TABLE */}
        <div className="lg:col-span-2 p-6 bg-brand-black border border-white/10 rounded-lg">
          <h3 className="font-title text-sm text-white uppercase tracking-wider mb-6 font-bold">Categorias Cadastradas</h3>

          {loading ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-gold mx-auto" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm font-sans text-slate-300 py-6">Nenhuma categoria cadastrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-sans font-bold text-slate-300 uppercase tracking-wider">
                    <th className="py-4">Nome</th>
                    <th className="py-4">Slug (URL Amigável)</th>
                    <th className="py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-sm font-sans text-slate-200">
                  {categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 font-semibold text-white">
                        {editingId === cat.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-black border border-white/20 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-brand-gold text-white"
                          />
                        ) : (
                          cat.name
                        )}
                      </td>
                      <td className="py-4 text-slate-300 font-mono">
                        {editingId === cat.id ? (
                          <span className="text-xs italic text-slate-400">Gerado automaticamente</span>
                        ) : (
                          cat.slug
                        )}
                      </td>
                      <td className="py-4 text-right">
                        {editingId === cat.id ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleSaveEdit(cat.id)}
                              disabled={editLoading}
                              className="p-2 text-green-400 hover:text-green-300 bg-green-950/40 border border-green-500/30 rounded"
                              title="Salvar"
                            >
                              {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-2 text-slate-300 hover:text-white bg-white/10 border border-white/15 rounded"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleStartEdit(cat)}
                              className="p-2 text-white hover:text-brand-gold bg-white/5 border border-white/10 hover:border-brand-gold/40 rounded transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              className="p-2 text-slate-300 hover:text-red-400 bg-white/5 border border-white/10 hover:border-red-500/30 rounded transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
