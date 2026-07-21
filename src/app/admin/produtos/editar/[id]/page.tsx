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

interface ProductImage {
  id: string
  image_url: string
  display_order?: number
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function AdminEditarProdutoPage({ params }: PageProps) {
  const { id } = React.use(params)
  const router = useRouter()
  const supabase = createClient()

  // Form states
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)

  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [price, setPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'in_stock' | 'pre_order' | 'on_request'>('in_stock')
  const [featured, setFeatured] = useState(false)
  const [displayOrder, setDisplayOrder] = useState('0')
  const [stockQuantity, setStockQuantity] = useState(0)

  // Image states
  const [existingImages, setExistingImages] = useState<ProductImage[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]) // database image IDs to delete

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    async function loadFormData() {
      try {
        // 1. Fetch categories
        const { data: cats } = await supabase
          .from('categories')
          .select('id, name')
          .order('name')
        if (cats) setCategories(cats)

        // 2. Fetch product by ID
        const { data: prod, error: prodErr } = await supabase
          .from('products')
          .select('*, product_images(id, image_url, display_order)')
          .eq('id', id)
          .single()

        if (prodErr || !prod) {
          alert('Produto não localizado.')
          router.push('/admin/produtos')
          return
        }

        setName(prod.name)
        setBrand(prod.brand || '')
        setCategoryId(prod.category_id || '')
        setPrice(prod.price !== null && prod.price !== undefined ? String(prod.price) : '')
        setSalePrice(prod.sale_price !== null && prod.sale_price !== undefined ? String(prod.sale_price) : '')
        setDescription(prod.description || '')
        setStatus(prod.status)
        setFeatured(prod.featured)
        setDisplayOrder(String(prod.display_order))
        setStockQuantity(prod.stock_quantity || 0)

        // Sort fetched images by display_order asc
        if (prod.product_images) {
          const sortedImgs = [...prod.product_images].sort((a: any, b: any) => {
            const orderA = a.display_order ?? 0
            const orderB = b.display_order ?? 0
            return orderA - orderB
          })
          setExistingImages(sortedImgs)
        }

      } catch (err) {
        console.error('Error loading product form data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadFormData()
  }, [id])

  // Handle new files
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

  const removeNewFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    URL.revokeObjectURL(previews[index])
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const queueDeleteExisting = (imageId: string) => {
    setImagesToDelete((prev) => [...prev, imageId])
    setExistingImages((prev) => prev.filter(img => img.id !== imageId))
  }

  // Reorder existing images
  const moveExistingLeft = (index: number) => {
    if (index <= 0) return
    setExistingImages(prev => {
      const updated = [...prev]
      const temp = updated[index]
      updated[index] = updated[index - 1]
      updated[index - 1] = temp
      return updated
    })
  }

  const moveExistingRight = (index: number) => {
    if (index >= existingImages.length - 1) return
    setExistingImages(prev => {
      const updated = [...prev]
      const temp = updated[index]
      updated[index] = updated[index + 1]
      updated[index + 1] = temp
      return updated
    })
  }

  // Reorder new previews
  const moveNewLeft = (index: number) => {
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

  const moveNewRight = (index: number) => {
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

      // 1. Update product table
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name,
          slug,
          brand: brand || null,
          category_id: categoryId,
          price: parsedPrice,
          sale_price: parsedSalePrice,
          description,
          status,
          featured,
          display_order: parseInt(displayOrder) || 0
        })
        .eq('id', id)

      if (updateError) {
        alert('Erro ao atualizar o produto. Verifique os dados.')
        setSubmitLoading(false)
        return
      }

      // 2. Delete queued existing images
      if (imagesToDelete.length > 0) {
        for (const imgId of imagesToDelete) {
          await supabase
            .from('product_images')
            .delete()
            .eq('id', imgId)
        }
      }

      // 3. Update display_order for remaining existing images
      for (let i = 0; i < existingImages.length; i++) {
        const img = existingImages[i]
        await supabase
          .from('product_images')
          .update({ display_order: i })
          .eq('id', img.id)
      }

      // 4. Upload new images to Supabase Storage with display_order starting after existing
      if (selectedFiles.length > 0) {
        const startOrder = existingImages.length
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i]
          const fileExtension = file.name.split('.').pop()
          const fileName = `${id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`
          const filePath = `${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file)

          if (uploadError) {
            console.error('Upload error:', uploadError)
            continue
          }

          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath)

          await supabase
            .from('product_images')
            .insert([{
              product_id: id,
              image_url: publicUrl,
              display_order: startOrder + i
            }])
        }
      }

      router.push('/admin/produtos')
      router.refresh()
    } catch (err) {
      console.error(err)
      alert('Erro inesperado ao editar o produto.')
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
          <h1 className="font-title text-2xl sm:text-3xl text-white uppercase tracking-wide">Editar Produto</h1>
          <p className="font-sans text-sm text-slate-300 mt-1">Modifique as informações e fotos do item selecionado</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-gold mx-auto" />
          <p className="text-sm font-sans text-slate-300 mt-3">Carregando detalhes do produto...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 bg-brand-black border border-white/10 rounded-lg p-8">
          {/* GENERAL INFO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-2">Nome do Produto *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
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

          {/* PRICING */}
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
              <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-2">Preço Promocional (R$ - Opcional)</label>
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

          {/* STOCK INFO (READ ONLY) */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-sans text-brand-gold uppercase tracking-wider font-bold">Estoque Atual Físico</h4>
                <p className="text-sm font-sans text-slate-300 mt-1">
                  Este produto possui <strong className="text-white font-mono text-base">{stockQuantity}</strong> unidades registradas em estoque.
                </p>
              </div>
              <span className="text-xs font-sans text-slate-300 bg-black border border-white/15 px-4 py-2 rounded uppercase tracking-wider text-center sm:text-left">
                Gerenciável via aba "Movimentações"
              </span>
            </div>
          </div>

          {/* ADDITIONAL INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-2">Ordem de Exibição do Produto</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-gold text-white"
              />
            </div>

            <div className="flex items-center h-full pt-6">
              <label className="flex items-center gap-3 cursor-pointer text-sm font-sans text-white">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-5 h-5 rounded bg-black border border-white/20 text-brand-gold focus:ring-0 cursor-pointer accent-brand-gold"
                />
                Marcar como Produto em Destaque (Exibe na Home)
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
              className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm font-sans focus:outline-none focus:border-brand-gold text-white resize-none"
            />
          </div>

          {/* EXISTING IMAGES WITH REORDERING */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider">
                Galeria Atual do Produto & Reordenação ({existingImages.length})
              </label>
              <span className="text-xs text-slate-300 font-sans">
                A 1ª foto é a <strong>Capa Oficial</strong>. Use as setas para alterar a posição das fotos.
              </span>
            </div>

            {existingImages.length === 0 ? (
              <p className="text-xs font-sans text-slate-400 py-3 italic">Nenhuma foto cadastrada atualmente.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {existingImages.map((img, index) => (
                  <div
                    key={img.id}
                    className={`relative aspect-square rounded-lg border overflow-hidden group bg-black flex flex-col justify-between ${
                      index === 0 ? 'border-brand-gold ring-2 ring-brand-gold/40' : 'border-white/15'
                    }`}
                  >
                    <Image
                      src={img.image_url}
                      alt="Foto do produto"
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
                      onClick={() => queueDeleteExisting(img.id)}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-black/80 hover:bg-red-500 rounded text-white transition-colors"
                      title="Excluir foto"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Controls bar bottom */}
                    <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black via-black/80 to-transparent flex justify-between items-center z-10">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveExistingLeft(index)}
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
                        disabled={index === existingImages.length - 1}
                        onClick={() => moveExistingRight(index)}
                        className="p-1 bg-white/10 hover:bg-brand-gold hover:text-black rounded text-white disabled:opacity-30 transition-colors"
                        title="Mover para direita"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* NEW IMAGES UPLOAD */}
          <div>
            <label className="block text-xs font-sans font-bold text-brand-gold uppercase tracking-wider mb-2">
              Adicionar Novas Imagens à Galeria
            </label>
            
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
              <p className="font-sans text-sm text-white font-bold mb-1">Arraste e solte novos arquivos aqui</p>
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

            {/* NEW PREVIEWS WITH REORDERING */}
            {previews.length > 0 && (
              <div className="mt-6 space-y-3">
                <h4 className="text-xs font-sans font-bold text-slate-300 uppercase tracking-wider">
                  Novas Imagens Selecionadas ({previews.length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {previews.map((preview, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg border border-white/15 overflow-hidden group bg-black flex flex-col justify-between"
                    >
                      <Image
                        src={preview}
                        alt={`Novo Preview ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      
                      <div className="absolute top-2 left-2 z-10">
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-black/80 text-white rounded">
                          +{index + 1}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeNewFile(index)}
                        className="absolute top-2 right-2 z-10 p-1.5 bg-black/80 hover:bg-red-500 rounded text-white transition-colors"
                        title="Remover foto"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black via-black/80 to-transparent flex justify-between items-center z-10">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveNewLeft(index)}
                          className="p-1 bg-white/10 hover:bg-brand-gold hover:text-black rounded text-white disabled:opacity-30 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-sans text-slate-300 font-bold">
                          {existingImages.length + index + 1}º
                        </span>
                        <button
                          type="button"
                          disabled={index === previews.length - 1}
                          onClick={() => moveNewRight(index)}
                          className="p-1 bg-white/10 hover:bg-brand-gold hover:text-black rounded text-white disabled:opacity-30 transition-colors"
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
                  Salvando Alterações...
                </>
              ) : (
                'Salvar Alterações'
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
