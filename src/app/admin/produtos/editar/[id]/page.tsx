'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, Upload, X, ImageIcon } from 'lucide-react'
import Image from 'next/image'


interface Category {
  id: string
  name: string
}

interface ProductImage {
  id: string
  image_url: string
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
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]) // holds database image IDs to delete on save

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
          .select('*, product_images(id, image_url)')
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
        setPrice(String(prod.price))
        setSalePrice(prod.sale_price ? String(prod.sale_price) : '')
        setDescription(prod.description || '')
        setStatus(prod.status)
        setFeatured(prod.featured)
        setDisplayOrder(String(prod.display_order))
        setExistingImages(prod.product_images || [])
        setStockQuantity(prod.stock_quantity || 0)

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
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9\s-]/g, '') // remove invalid chars
      .replace(/\s+/g, '-') // collapse whitespace and replace by -
      .replace(/-+/g, '-') // collapse dashes
      .trim()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !categoryId || !price) {
      alert('Por favor, preencha os campos obrigatórios.')
      return
    }

    setSubmitLoading(true)
    const slug = generateSlug(name)

    try {
      // 1. Update product table
      const { error: updateError } = await supabase
        .from('products')
        .update({
          name,
          slug,
          brand: brand || null,
          category_id: categoryId,
          price: parseFloat(price),
          sale_price: salePrice ? parseFloat(salePrice) : null,
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

      // 2. Perform queued image deletions from DB
      if (imagesToDelete.length > 0) {
        for (const imgId of imagesToDelete) {
          // Deleting from DB. Storage files can remain or be cleaned up,
          // but DB RLS cascading lets us simply delete the row.
          await supabase
            .from('product_images')
            .delete()
            .eq('id', imgId)
        }
      }

      // 3. Upload new images to Supabase Storage if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
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

          // Get URL
          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath)

          // Link in DB
          await supabase
            .from('product_images')
            .insert([{
              product_id: id,
              image_url: publicUrl
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
    <div className="space-y-12">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/produtos"
          className="p-2 border border-white/10 hover:border-brand-gold text-brand-silver hover:text-white rounded transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-title text-2xl sm:text-3xl text-white uppercase tracking-wide">Editar Produto</h1>
          <p className="font-sans text-xs text-brand-silver mt-1">Modifique as informações do item selecionado</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-gold mx-auto" />
          <p className="text-xs font-sans text-brand-silver mt-3">Carregando detalhes do produto...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 bg-brand-black border border-white/5 rounded-lg p-8">
          {/* GENERAL INFO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-2">Nome do Produto *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black border border-white/10 rounded px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-2">Marca (Opcional)</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex: Chanel, Apple, JBL"
                className="w-full bg-black border border-white/10 rounded px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-2">Categoria *</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-black border border-white/10 rounded px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white cursor-pointer"
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
              <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-2">Preço Base (R$) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-black border border-white/10 rounded px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-2">Preço Promocional (R$ - Opcional)</label>
              <input
                type="number"
                step="0.01"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="w-full bg-black border border-white/10 rounded px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-2">Status do Produto *</label>
              <select
                required
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-black border border-white/10 rounded px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white cursor-pointer"
              >
                <option value="in_stock">Em Estoque</option>
                <option value="pre_order">Sob Encomenda</option>
                <option value="on_request">Importação sob Consulta</option>
              </select>
            </div>
          </div>

          {/* STOCK INFO (READ ONLY) */}
          <div className="bg-white/5 border border-white/5 rounded p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-[10px] font-sans text-brand-gold uppercase tracking-widest font-bold">Estoque Atual</h4>
                <p className="text-xs font-sans text-brand-silver mt-1">
                  Este produto possui <strong className="text-white font-mono">{stockQuantity}</strong> unidades registradas em estoque.
                </p>
              </div>
              <span className="text-[10px] font-sans text-brand-silver bg-black border border-white/10 px-3 py-1.5 rounded uppercase tracking-wider text-center sm:text-left">
                Ajustável via aba "Movimentações"
              </span>
            </div>
          </div>

          {/* ADDITIONAL INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-2">Ordem de Exibição (Crescente)</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
                className="w-full bg-black border border-white/10 rounded px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
              />
            </div>

            <div className="flex items-center h-full pt-6">
              <label className="flex items-center gap-3 cursor-pointer text-xs font-sans text-white">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-5 h-5 rounded bg-black border border-white/10 text-brand-gold focus:ring-0 cursor-pointer accent-brand-gold"
                />
                Marcar como Produto em Destaque (Exibe na Home)
              </label>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-2">Descrição Detalhada</label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black border border-white/10 rounded px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white resize-none"
            />
          </div>

          {/* CURRENT IMAGES */}
          {existingImages.length > 0 && (
            <div>
              <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-4">Imagens Atuais da Galeria</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {existingImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-square rounded border border-white/10 overflow-hidden group bg-black"
                  >
                    <Image
                      src={img.image_url}
                      alt="Foto do produto"
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => queueDeleteExisting(img.id)}
                      className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-red-500 rounded text-white transition-colors"
                      title="Excluir imagem"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NEW IMAGES UPLOAD */}
          <div>
            <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-2">Adicionar Novas Imagens</label>
            
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-all ${
                dragActive
                  ? 'border-brand-gold bg-brand-gold/5'
                  : 'border-white/10 bg-black hover:border-white/20'
              }`}
            >
              <Upload className="w-10 h-10 text-brand-gold mb-4" />
              <p className="font-sans text-xs text-brand-white font-bold mb-1">Arraste e solte arquivos aqui</p>
              <p className="font-sans text-[10px] text-brand-silver mb-4">Ou clique para procurar arquivos</p>
              
              <label className="px-4 py-2 border border-white/20 text-brand-white text-xs font-sans font-bold uppercase rounded hover:border-brand-gold hover:text-brand-gold cursor-pointer transition-colors">
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

            {/* NEW PREVIEWS */}
            {previews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6">
                {previews.map((preview, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded border border-white/10 overflow-hidden group bg-black"
                  >
                    <Image
                      src={preview}
                      alt={`Novo Upload Preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewFile(index)}
                      className="absolute top-2 right-2 p-1.5 bg-black/80 hover:bg-red-500 rounded text-white transition-colors"
                      title="Remover imagem"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ACTIONS */}
          <div className="flex gap-4 pt-6 border-t border-white/5">
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
