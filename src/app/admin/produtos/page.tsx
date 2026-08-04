'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Edit2, 
  Trash2, 
  Star, 
  StarOff, 
  Image as ImageIcon,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react'

interface Product {
  id: string
  name: string
  brand: string | null
  slug: string
  price: number | null
  sale_price: number | null
  status: string
  featured: boolean
  display_order: number
  category_name: string
  image_url: string | null
  stock_quantity: number
  is_public: boolean
}

interface Category {
  id: string
  name: string
}

export default function AdminProdutosPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const supabase = createClient()

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      // 1. Fetch categories
      const { data: dbCats } = await supabase
        .from('categories')
        .select('id, name')
        .order('name')
      if (dbCats) setCategories(dbCats)

      // 2. Fetch products with first image ordered by display_order
      const { data: dbProds } = await supabase
        .from('products')
        .select(`
          id, name, brand, slug, price, sale_price, status, featured, display_order, stock_quantity, is_public,
          categories(name),
          product_images(image_url, display_order)
        `)
        .order('display_order', { ascending: true })

      if (dbProds) {
        const formatted = dbProds.map((p: any) => {
          let imgUrl: string | null = null
          if (p.product_images && p.product_images.length > 0) {
            const sorted = [...p.product_images].sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
            imgUrl = sorted[0].image_url
          }
          return {
            id: p.id,
            name: p.name,
            brand: p.brand || null,
            slug: p.slug,
            price: p.price !== null && p.price !== undefined ? Number(p.price) : null,
            sale_price: p.sale_price !== null && p.sale_price !== undefined ? Number(p.sale_price) : null,
            status: p.status,
            featured: p.featured,
            display_order: p.display_order,
            category_name: p.categories?.name || 'Sem Categoria',
            image_url: imgUrl,
            stock_quantity: p.stock_quantity || 0,
            is_public: p.is_public !== false
          }
        })
        setProducts(formatted)
      }
    } catch (err) {
      console.error('Error fetching admin products data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Delete product action
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir permanentemente o produto "${name}"?\nEsta ação não poderá ser desfeita.`)) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id)

      if (error) {
        alert('Erro ao excluir o produto.')
        return
      }

      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  // Toggle Featured status
  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ featured: !current })
        .eq('id', id)

      if (error) {
        alert('Erro ao alterar status de destaque.')
        return
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, featured: !current } : p))
      )
    } catch (err) {
      console.error(err)
    }
  }

  // Format Price
  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return 'Sob Consulta'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  // Extract unique available brands from products
  const availableBrands = Array.from(
    new Set(products.map((p) => p.brand).filter((b): b is string => Boolean(b)))
  ).sort()

  // Filter products locally for instant response
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesBrand = selectedBrand === 'all' || (p.brand && p.brand.toLowerCase() === selectedBrand.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || p.category_name === selectedCategory
    return matchesSearch && matchesBrand && matchesCategory
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <span className="px-3 py-1 text-xs font-sans font-bold uppercase text-green-400 bg-green-950/70 border border-green-500/30 rounded">Estoque</span>
      case 'pre_order':
        return <span className="px-3 py-1 text-xs font-sans font-bold uppercase text-amber-400 bg-amber-950/70 border border-amber-500/30 rounded">Encomenda</span>
      case 'on_request':
        return <span className="px-3 py-1 text-xs font-sans font-bold uppercase text-blue-400 bg-blue-950/70 border border-blue-500/30 rounded">Consulta</span>
      default:
        return <span className="px-3 py-1 text-xs font-sans font-bold uppercase text-slate-300 bg-white/10 border border-white/15 rounded">{status}</span>
    }
  }

  const getVisibilityBadge = (isPublic: boolean) => {
    if (isPublic) {
      return <span className="px-2 py-1 text-[10px] font-sans font-bold uppercase text-blue-400 bg-blue-950/70 border border-blue-500/30 rounded flex items-center gap-1 w-max"><Eye className="w-3 h-3" /> Público</span>
    }
    return <span className="px-2 py-1 text-[10px] font-sans font-bold uppercase text-red-400 bg-red-950/70 border border-red-500/30 rounded flex items-center gap-1 w-max"><EyeOff className="w-3 h-3" /> Oculto</span>
  }

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="font-title text-2xl sm:text-3xl text-white uppercase tracking-wide">Produtos</h1>
          <p className="font-sans text-sm text-slate-300 mt-1">Cadastre, edite e organize os itens do catálogo</p>
        </div>

        <Link
          href="/admin/produtos/novo"
          className="flex items-center gap-2 px-5 py-3.5 bg-brand-gold text-black font-sans text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 transition-all duration-300 shadow-md shadow-brand-gold/10"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </Link>
      </div>

      {/* FILTER BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome ou marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-brand-black border border-white/15 rounded px-11 py-3 text-sm font-sans focus:outline-none focus:border-brand-gold text-white"
          />
        </div>

        {/* Brand select filter */}
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="w-4 h-4 text-brand-gold shrink-0" />
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="w-full bg-brand-black border border-white/15 text-sm font-sans text-white rounded px-4 py-3 focus:outline-none focus:border-brand-gold cursor-pointer"
          >
            <option value="all">Todas as Marcas</option>
            {availableBrands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Category select filter */}
        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-brand-black border border-white/15 text-sm font-sans text-white rounded px-4 py-3 focus:outline-none focus:border-brand-gold cursor-pointer"
          >
            <option value="all">Todas as Categorias</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE LISTING */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-gold mx-auto" />
          <p className="text-sm font-sans text-slate-300 mt-3">Carregando lista de produtos...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-white/10 rounded-lg">
          <p className="text-sm font-sans text-slate-300">Nenhum produto cadastrado com essas especificações.</p>
        </div>
      ) : (
        <div className="bg-brand-black border border-white/10 rounded-lg p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-sans text-slate-300 uppercase tracking-wider font-bold">
                  <th className="py-4 w-16">Foto</th>
                  <th className="py-4">Produto</th>
                  <th className="py-4">Categoria</th>
                  <th className="py-4">Preço Base</th>
                  <th className="py-4">Preço Promocional</th>
                  <th className="py-4">Estoque</th>
                  <th className="py-4">Ordem</th>
                  <th className="py-4">Visibilidade</th>
                  <th className="py-4">Status</th>
                  <th className="py-4">Destaque</th>
                  <th className="py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-sm font-sans text-slate-200">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    {/* Thumbnail */}
                    <td className="py-4">
                      <div className="relative w-12 h-12 rounded border border-white/15 bg-black flex items-center justify-center overflow-hidden">
                        {p.image_url ? (
                          <Image
                            src={p.image_url}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="py-4 font-semibold text-white max-w-sm truncate pr-4">
                      {p.brand && <span className="block text-xs font-bold text-brand-gold uppercase tracking-wider mb-0.5">{p.brand}</span>}
                      {p.name}
                    </td>

                    {/* Category */}
                    <td className="py-4 text-slate-300 font-medium">{p.category_name}</td>

                    {/* Base Price */}
                    <td className="py-4 font-semibold">
                      {p.price === null ? (
                        <span className="text-xs text-brand-gold-light font-bold uppercase">Sob Consulta</span>
                      ) : (
                        formatPrice(p.price)
                      )}
                    </td>

                    {/* Sale Price */}
                    <td className="py-4 text-brand-gold-light font-bold">
                      {p.sale_price ? formatPrice(p.sale_price) : '-'}
                    </td>

                    {/* Stock quantity */}
                    <td className="py-4 font-mono font-bold text-white">
                      {p.stock_quantity} un
                    </td>

                    {/* Display Order */}
                    <td className="py-4 font-mono text-slate-300 font-bold">{p.display_order}</td>

                    {/* Visibilidade */}
                    <td className="py-4">{getVisibilityBadge(p.is_public)}</td>

                    {/* Status */}
                    <td className="py-4">{getStatusBadge(p.status)}</td>

                    {/* Featured Toggle */}
                    <td className="py-4">
                      <button
                        onClick={() => handleToggleFeatured(p.id, p.featured)}
                        className={`p-2 rounded border transition-colors ${
                          p.featured
                            ? 'text-brand-gold border-brand-gold/40 hover:border-brand-gold bg-brand-gold/10'
                            : 'text-slate-400 border-white/10 hover:border-white/30'
                        }`}
                        title={p.featured ? 'Remover destaque' : 'Tornar destaque'}
                      >
                        {p.featured ? <Star className="w-4 h-4 fill-brand-gold" /> : <StarOff className="w-4 h-4" />}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/produtos/editar/${p.id}`}
                          className="p-2.5 text-white hover:text-brand-gold bg-white/5 border border-white/15 hover:border-brand-gold/40 rounded transition-colors inline-block"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-2.5 text-slate-400 hover:text-red-400 bg-white/5 border border-white/15 hover:border-red-500/30 rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
