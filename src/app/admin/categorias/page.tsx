'use client'

import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Tag, Loader2, Check, X, Upload, ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface Category {
  id: string
  name: string
  slug: string
  image_url?: string | null
}

export default function AdminCategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Add category form state
  const [newName, setNewName] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null)
  const [newDragActive, setNewDragActive] = useState(false)
  const newFileInputRef = useRef<HTMLInputElement>(null)

  // Edit category form state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editImageFile, setEditImageFile] = useState<File | null>(null)
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null)
  const [editCurrentImageUrl, setEditCurrentImageUrl] = useState<string | null>(null)
  const [editDragActive, setEditDragActive] = useState(false)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })
      if (data) setCategories(data)
    } catch (err) {
      console.error('Error fetching categories:', err)
    } finally {
      setLoading(false)
    }
  }

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

  const uploadCategoryImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop()
    const fileName = `category-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file)
    if (uploadError) {
      console.error('Upload error:', uploadError)
      return null
    }
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName)
    return publicUrl
  }

  // --- ADD IMAGE HANDLERS ---
  const handleNewImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) { alert('Por favor, envie apenas arquivos de imagem.'); return }
    if (newImagePreview) URL.revokeObjectURL(newImagePreview)
    setNewImageFile(file)
    setNewImagePreview(URL.createObjectURL(file))
  }
  const handleNewDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setNewDragActive(true)
    else if (e.type === 'dragleave') setNewDragActive(false)
  }
  const handleNewDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setNewDragActive(false)
    const file = e.dataTransfer.files?.[0]; if (file) handleNewImageFile(file)
  }
  const handleNewFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) handleNewImageFile(file)
  }
  const clearNewImage = () => {
    if (newImagePreview) URL.revokeObjectURL(newImagePreview)
    setNewImageFile(null); setNewImagePreview(null)
    if (newFileInputRef.current) newFileInputRef.current.value = ''
  }

  // --- EDIT IMAGE HANDLERS ---
  const handleEditImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) { alert('Por favor, envie apenas arquivos de imagem.'); return }
    if (editImagePreview) URL.revokeObjectURL(editImagePreview)
    setEditImageFile(file); setEditImagePreview(URL.createObjectURL(file))
  }
  const handleEditDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setEditDragActive(true)
    else if (e.type === 'dragleave') setEditDragActive(false)
  }
  const handleEditDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setEditDragActive(false)
    const file = e.dataTransfer.files?.[0]; if (file) handleEditImageFile(file)
  }
  const handleEditFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (file) handleEditImageFile(file)
  }
  const clearEditImage = () => {
    if (editImagePreview) URL.revokeObjectURL(editImagePreview)
    setEditImageFile(null); setEditImagePreview(null); setEditCurrentImageUrl(null)
    if (editFileInputRef.current) editFileInputRef.current.value = ''
  }

  // --- CRUD ---
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setAddLoading(true)
    const slug = generateSlug(newName)
    try {
      let imageUrl: string | null = null
      if (newImageFile) imageUrl = await uploadCategoryImage(newImageFile)
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: newName.trim(), slug, image_url: imageUrl }])
        .select()
      if (error) { alert('Erro ao criar categoria. Talvez ela ja exista (slug duplicado).'); setAddLoading(false); return }
      if (data) {
        setCategories((prev) => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)))
        setNewName(''); clearNewImage()
      }
    } catch (err) { console.error(err) } finally { setAddLoading(false) }
  }

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id); setEditName(cat.name)
    setEditCurrentImageUrl(cat.image_url || null)
    setEditImageFile(null); setEditImagePreview(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null); setEditName(''); setEditCurrentImageUrl(null); clearEditImage()
  }

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return
    setEditLoading(true)
    const slug = generateSlug(editName)
    try {
      let imageUrl = editCurrentImageUrl
      if (editImageFile) { const uploaded = await uploadCategoryImage(editImageFile); if (uploaded) imageUrl = uploaded }
      const { error } = await supabase
        .from('categories')
        .update({ name: editName.trim(), slug, image_url: imageUrl })
        .eq('id', id)
      if (error) { alert('Erro ao editar categoria.'); setEditLoading(false); return }
      setCategories((prev) =>
        prev.map((cat) => cat.id === id ? { ...cat, name: editName.trim(), slug, image_url: imageUrl } : cat)
          .sort((a, b) => a.name.localeCompare(b.name))
      )
      setEditingId(null); setEditName(''); setEditCurrentImageUrl(null); clearEditImage()
    } catch (err) { console.error(err) } finally { setEditLoading(false) }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${name}"?\nIsso podera desassociar produtos desta categoria.`)) return
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) { alert('Erro ao excluir categoria.'); return }
      setCategories((prev) => prev.filter((cat) => cat.id !== id))
    } catch (err) { console.error(err) }
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-title text-2xl sm:text-3xl text-white uppercase tracking-wide">Categorias</h1>
        <p className="font-sans text-sm text-slate-300 mt-1">Gerencie as categorias de importados disponiveis na vitrine</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* ADD FORM */}
        <div className="p-6 bg-brand-black border border-white/10 rounded-lg">
          <h3 className="font-title text-sm text-white uppercase tracking-wider mb-6 flex items-center gap-2 font-bold">
            <Tag className="w-4 h-4 text-brand-gold" />
            Nova Categoria
          </h3>
          <form onSubmit={handleAddCategory} className="space-y-5">
            <div>
              <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-2">Nome da Categoria</label>
              <input
                type="text" required value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Oculos de Sol, Relogios"
                className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-gold text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-2">
                Foto da Categoria <span className="text-slate-400 normal-case font-normal">(opcional)</span>
              </label>
              {newImagePreview ? (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-brand-gold/40 bg-black group">
                  <Image src={newImagePreview} alt="Preview" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="px-3 py-2 bg-brand-gold text-black text-xs font-bold uppercase rounded cursor-pointer flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />Trocar
                      <input ref={newFileInputRef} type="file" accept="image/*" onChange={handleNewFileInput} className="hidden" />
                    </label>
                    <button type="button" onClick={clearNewImage} className="px-3 py-2 bg-red-600 text-white text-xs font-bold uppercase rounded flex items-center gap-1.5">
                      <X className="w-3.5 h-3.5" />Remover
                    </button>
                  </div>
                  <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold bg-brand-gold text-black rounded uppercase">Nova</span>
                </div>
              ) : (
                <div
                  onDragEnter={handleNewDrag} onDragOver={handleNewDrag} onDragLeave={handleNewDrag} onDrop={handleNewDrop}
                  onClick={() => newFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${newDragActive ? 'border-brand-gold bg-brand-gold/10' : 'border-white/20 bg-black hover:border-white/40'}`}
                >
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                  <p className="font-sans text-xs text-slate-300 text-center">Arraste ou <span className="text-brand-gold font-bold">clique para selecionar</span></p>
                  <input ref={newFileInputRef} type="file" accept="image/*" onChange={handleNewFileInput} className="hidden" />
                </div>
              )}
            </div>

            <button
              type="submit" disabled={addLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-gold text-black font-sans text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 transition-all duration-300 disabled:opacity-50"
            >
              {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Adicionar Categoria
            </button>
          </form>
        </div>

        {/* LIST */}
        <div className="lg:col-span-2 p-6 bg-brand-black border border-white/10 rounded-lg">
          <h3 className="font-title text-sm text-white uppercase tracking-wider mb-6 font-bold">Categorias Cadastradas</h3>

          {loading ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-gold mx-auto" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm font-sans text-slate-300 py-6">Nenhuma categoria cadastrada.</p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className={`border rounded-lg transition-colors ${editingId === cat.id ? 'border-brand-gold/40 bg-brand-gold/5' : 'border-white/10 bg-black/30 hover:bg-white/5'}`}
                >
                  {editingId === cat.id ? (
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-1.5">Nome</label>
                            <input
                              type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                              className="w-full bg-black border border-white/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-brand-gold text-white"
                            />
                          </div>
                          <div>
                            <span className="block text-xs font-sans font-bold text-slate-400 uppercase tracking-wider mb-1">Slug</span>
                            <span className="text-xs font-mono text-slate-500 italic">{generateSlug(editName)}</span>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-1.5">Foto da Categoria</label>
                          {(editImagePreview || editCurrentImageUrl) ? (
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-brand-gold/40 bg-black group">
                              <Image src={editImagePreview || editCurrentImageUrl!} alt="Preview" fill className="object-cover" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <label className="px-3 py-2 bg-brand-gold text-black text-xs font-bold uppercase rounded cursor-pointer flex items-center gap-1.5">
                                  <Upload className="w-3.5 h-3.5" />Trocar
                                  <input ref={editFileInputRef} type="file" accept="image/*" onChange={handleEditFileInput} className="hidden" />
                                </label>
                                <button type="button" onClick={clearEditImage} className="px-3 py-2 bg-red-600 text-white text-xs font-bold uppercase rounded flex items-center gap-1.5">
                                  <X className="w-3.5 h-3.5" />Remover
                                </button>
                              </div>
                              {editImagePreview && <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold bg-brand-gold text-black rounded uppercase">Nova</span>}
                            </div>
                          ) : (
                            <div
                              onDragEnter={handleEditDrag} onDragOver={handleEditDrag} onDragLeave={handleEditDrag} onDrop={handleEditDrop}
                              onClick={() => editFileInputRef.current?.click()}
                              className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${editDragActive ? 'border-brand-gold bg-brand-gold/10' : 'border-white/20 bg-black hover:border-white/40'}`}
                            >
                              <ImageIcon className="w-7 h-7 text-slate-400" />
                              <p className="font-sans text-xs text-slate-300 text-center">Arraste ou <span className="text-brand-gold font-bold">clique para selecionar</span></p>
                              <input ref={editFileInputRef} type="file" accept="image/*" onChange={handleEditFileInput} className="hidden" />
                            </div>
                          )}
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
                    <div className="flex items-center gap-4 p-3">
                      <div className="w-12 h-12 rounded flex-shrink-0 overflow-hidden border border-white/10 bg-black flex items-center justify-center">
                        {cat.image_url ? (
                          <Image src={cat.image_url} alt={cat.name} width={48} height={48} className="object-cover w-full h-full" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{cat.name}</p>
                        <p className="text-xs font-mono text-slate-500 truncate">{cat.slug}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => handleStartEdit(cat)} className="p-2 text-white hover:text-brand-gold bg-white/5 border border-white/10 hover:border-brand-gold/40 rounded transition-colors" title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteCategory(cat.id, cat.name)} className="p-2 text-slate-300 hover:text-red-400 bg-white/5 border border-white/10 hover:border-red-500/30 rounded transition-colors" title="Excluir">
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
