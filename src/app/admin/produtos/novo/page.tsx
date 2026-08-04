'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, Upload, X, ImageIcon, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import Image from 'next/image'

interface Category {
  id: string
  name: string
}

export default function AdminNovoProdutoPage() {
  const router = useRouter()
  const supabase = createClient()

  // Form states
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)

  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [price, setPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'in_stock' | 'pre_order' | 'on_request'>('in_stock')
  const [featured, setFeatured] = useState(false)
  const [isPublic, setIsPublic] = useState(true)
  const [displayOrder, setDisplayOrder] = useState('0')
  const [initialStock, setInitialStock] = useState('')
  const [initialCost, setInitialCost] = useState('')

  // Drag and drop / file states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    async function loadCategories() {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .order('name')
        
        if (data) {
          setCategories(data)
          if (data.length > 0) setCategoryId(data[0].id)
        }
      } catch (err) {
        console.error('Error loading categories:', err)
      } finally {
        setLoadingCategories(false)
      }
    }
    loadCategories()
  }, [])

  // Handle file additions
  const handleFiles = (files: FileList) => {
    const fileArray = Array.from(files)
    const validImages = fileArray.filter(file => file.type.startsWith('image/'))

    if (validImages.length === 0) {
      alert('Por favor, envie apenas arquivos de imagem.')
      return
    }

    setSelectedFiles((prev) => [...prev, ...validImages])

    const newPreviews = validImages.map(file => URL.createObjectURL(file))
    setPreviews((prev) => [...prev, ...newPreviews])
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    URL.revokeObjectURL(previews[index])
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  // Reordering files
  const moveFileLeft = (index: number) => {
    if (index <= 0) return
    setSelectedFiles(prev => {
      const updated = [...prev]
      const temp = updated[index]
      updated[index] = updated[index - 1]
      updated[index - 1] = temp
      return updated
    })
    setPreviews(prev => {
      const updated = [...prev]
      const temp = updated[index]
      updated[index] = updated[index - 1]
      updated[index - 1] = temp
      return updated
    })
  }

  const moveFileRight = (index: number) => {
    if (index >= selectedFiles.length - 1) return
    setSelectedFiles(prev => {
      const updated = [...prev]
      const temp = updated[index]
      updated[index] = updated[index + 1]
      updated[index + 1] = temp
      return updated
    })
    setPreviews(prev => {
      const updated = [...prev]
      const temp = updated[index]
      updated[index] = updated[index + 1]
      updated[index + 1] = temp
      return updated
    })
  }

  // Drag listeners
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !categoryId) {
      alert('Por favor, preencha o Nome e a Categoria do produto.')
      return
    }

    setSubmitLoading(true)
    const slug = generateSlug(name)

    try {
      const parsedPrice = price.trim() ? parseFloat(price) : null
      const parsedSalePrice = salePrice.trim() ? parseFloat(salePrice) : null

      const parsedStock = parseInt(initialStock) || 0
      const finalStatus = status === 'on_request' ? 'on_request' : (parsedStock > 0 ? 'in_stock' : 'pre_order')

      // 1. Create product record
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert([{
          name,
          slug,
          brand: brand || null,
          category_id: categoryId,
          price: parsedPrice,
          sale_price: parsedSalePrice,
          description,
          status: finalStatus,
          featured,
          display_order: parseInt(displayOrder) || 0,
          is_public: isPublic
        }])
        .select()

      if (productError || !productData) {
        alert('Erro ao cadastrar produto. Verifique se o nome já não está cadastrado.')
        setSubmitLoading(false)
        return
      }

      const newProduct = productData[0]

      // 1.5. Registrar estoque inicial se preenchido
      if (parsedStock > 0) {
        const parsedCost = parseFloat(initialCost) || 0
        const { error: movementError } = await supabase
          .from('product_movements')
          .insert([{
            product_id: newProduct.id,
            type: 'entrada',
            quantity: parsedStock,
            cost_price: parsedCost > 0 ? parsedCost : null,
            movement_date: new Date().toISOString(),
            payment_status: 'pago'
          }])

        if (movementError) {
          console.error('Error inserting initial stock movement:', movementError)
        }
      }

      // 2. Upload images to Supabase Storage with display_order
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i]
          const fileExtension = file.name.split('.').pop()
          const fileName = `${newProduct.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
          const filePath = `${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file)

          if (uploadError) {
            console.error('Upload error:', uploadError)
            continue
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath)

          // Insert image record with display_order
          await supabase
            .from('product_images')
            .insert([{
              product_id: newProduct.id,
              image_url: publicUrl,
              display_order: i
            }])
        }
      }

      router.push('/admin/produtos')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Erro inesperado ao cadastrar o produto.')
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/produtos"
          className="p-2.5 border border-white/10 hover:border-brand-gold text-slate-300 hover:text-white rounded transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-title text-2xl sm:text-3xl text-white uppercase tracking-wide">Novo Produto</h1>
          <p className="font-sans text-sm text-slate-300 mt-1">Insira as informações do novo item do catálogo</p>
        </div>
      </div>

      {loadingCategories ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-gold mx-auto" />
          <p className="text-sm font-sans text-slate-300 mt-3">Carregando formulário...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 bg-brand-black border border-white/10 rounded-lg p-8">
          {/* GENERAL INFO ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-2">Nome do Produto *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Bleu de Chanel Parfum 100ml"
                className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-gold text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-2">Marca (Opcional)</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex: Chanel, Apple, JBL"
                className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-gold text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-2">Categoria *</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-gold text-white cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PRICING ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-2">
                Preço Base (R$ - Opcional)
              </label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Deixe em branco p/ Sob Consulta"
                className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-gold text-white"
              />
              <span className="text-[11px] font-sans text-slate-400 mt-1 block">
                Se deixar em branco, o valor será exibido como "Sob Consulta" ou "Sob Encomenda".
              </span>
            </div>

            <div>
              <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-2">
                Preço Promocional (R$ - Opcional)
              </label>
              <input
                type="number"
                step="0.01"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="Ex: 899.00"
                className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-gold text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-2">Status do Produto *</label>
              <select
                required
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-gold text-white cursor-pointer"
              >
                <option value="in_stock">Em Estoque</option>
                <option value="pre_order">Sob Encomenda</option>
                <option value="on_request">Sob Consulta</option>
              </select>
            </div>
          </div>

          {/* INITIAL STOCK & COST */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-2">Estoque Inicial (Opcional)</label>
              <input
                type="number"
                min="0"
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
                placeholder="Ex: 10"
                className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-gold text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-2">Preço de Custo Unitário Inicial (R$ - Opcional)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={initialCost}
                onChange={(e) => setInitialCost(e.target.value)}
                placeholder="Ex: 50.00"
                className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-gold text-white"
              />
            </div>
          </div>

          {/* ADDITIONAL ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-2">Ordem de Exibição do Produto</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                placeholder="Ex: 0"
                className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-gold text-white"
              />
            </div>

            <div className="flex flex-col justify-center gap-4 h-full pt-6">
              <label className="flex items-center gap-3 cursor-pointer text-sm font-sans text-white">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-5 h-5 rounded bg-black border border-white/20 text-brand-gold focus:ring-0 cursor-pointer accent-brand-gold"
                />
                Marcar como Produto em Destaque (Exibe na Home)
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-sm font-sans text-white">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-5 h-5 rounded bg-black border border-white/20 text-brand-gold focus:ring-0 cursor-pointer accent-brand-gold"
                />
                Exibir Produto no Site (Se desmarcado, fica visível apenas no painel)
              </label>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-2">Descrição Detalhada</label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva as especificações do produto, diferenciais e informações importantes de importação..."
              className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-gold text-white resize-none"
            />
          </div>

          {/* DRAG AND DROP FILE UPLOADER & REORDERING GALLERY */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider">
                Galeria de Imagens & Ordem das Fotos
              </label>
              <span className="text-xs text-slate-300 font-sans">
                A 1ª foto será usada como <strong>Capa do Produto</strong>. Use as setas para definir a ordem.
              </span>
            </div>
            
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-all ${
                dragActive
                  ? 'border-brand-gold bg-brand-gold/10'
                  : 'border-white/20 bg-black hover:border-white/40'
              }`}
            >
              <Upload className="w-10 h-10 text-brand-gold mb-3" />
              <p className="font-sans text-sm text-white font-bold mb-1">Arraste e solte as imagens aqui</p>
              <p className="font-sans text-xs text-slate-300 mb-4">Ou clique para procurar arquivos de imagem</p>
              
              <label className="px-5 py-2.5 border border-white/20 text-white text-xs font-sans font-bold uppercase rounded hover:border-brand-gold hover:text-brand-gold cursor-pointer transition-colors">
                Selecionar Arquivos
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </div>

            {/* REORDERABLE PREVIEW CONTAINER */}
            {previews.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="text-xs font-sans font-bold text-slate-300 uppercase tracking-wider">
                  Gerenciar Ordem das Imagens ({previews.length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {previews.map((preview, index) => (
                    <div
                      key={index}
                      className={`relative aspect-square rounded-lg border overflow-hidden group bg-black flex flex-col justify-between ${
                        index === 0 ? 'border-brand-gold ring-2 ring-brand-gold/40' : 'border-white/15'
                      }`}
                    >
                      <Image
                        src={preview}
                        alt={`Upload Preview ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      
                      {/* Badge Cover */}
                      <div className="absolute top-2 left-2 z-10">
                        {index === 0 ? (
                          <span className="px-2 py-1 text-[10px] font-sans font-bold uppercase bg-brand-gold text-black rounded flex items-center gap-1 shadow">
                            <Star className="w-3 h-3 fill-black" />
                            Capa
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-black/80 text-white rounded">
                            #{index + 1}
                          </span>
                        )}
                      </div>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 z-10 p-1.5 bg-black/80 hover:bg-red-500 rounded text-white transition-colors"
                        title="Excluir imagem"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      {/* Controls bar bottom */}
                      <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black via-black/80 to-transparent flex justify-between items-center z-10">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveFileLeft(index)}
                          className="p-1 bg-white/10 hover:bg-brand-gold hover:text-black rounded text-white disabled:opacity-30 transition-colors"
                          title="Mover para esquerda"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-sans text-slate-300 font-bold">
                          {index + 1}º
                        </span>
                        <button
                          type="button"
                          disabled={index === previews.length - 1}
                          onClick={() => moveFileRight(index)}
                          className="p-1 bg-white/10 hover:bg-brand-gold hover:text-black rounded text-white disabled:opacity-30 transition-colors"
                          title="Mover para direita"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="flex gap-4 pt-6 border-t border-white/10">
            <button
              type="submit"
              disabled={submitLoading}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-gold-gradient text-black font-sans font-bold text-xs uppercase tracking-widest rounded hover:opacity-90 transition-all duration-300 disabled:opacity-50"
            >
              {submitLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cadastrando Produto...
                </>
              ) : (
                'Salvar Produto'
              )}
            </button>
            <Link
              href="/admin/produtos"
              className="px-8 py-4 bg-transparent border border-white/20 text-white font-sans font-bold text-xs uppercase tracking-widest rounded hover:border-white hover:text-white transition-all duration-300"
            >
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
