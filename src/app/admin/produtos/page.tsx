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
  Loader2
} from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  sale_price: number | null
  status: string
  featured: boolean
  display_order: number
  category_name: string
  image_url: string | null
  stock_quantity: number
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

      // 2. Fetch products with first image
      const { data: dbProds } = await supabase
        .from('products')
        .select(`
          id, name, slug, price, sale_price, status, featured, display_order, stock_quantity,
          categories(name),
          product_images(image_url)
        `)
        .order('display_order', { ascending: true })

      if (dbProds) {
        const formatted = dbProds.map((p: any) => {
          const imgUrl = p.product_images && p.product_images.length > 0
            ? p.product_images[0].image_url
            : null
          return {
            id: p.id,
            name: p.name,
            slug: p.slug,
            price: Number(p.price),
            sale_price: p.sale_price ? Number(p.sale_price) : null,
            status: p.status,
            featured: p.featured,
            display_order: p.display_order,
            category_name: p.categories?.name || 'Sem Categoria',
            image_url: imgUrl,
            stock_quantity: p.stock_quantity || 0
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

  // Delete product action (including cascading images in DB)
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Deseja realmente excluir permanentemente o produto "${name}"?\nEsta ação não poderá ser desfeita.`)) return

    try {
      // RLS enables authenticated users to delete
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
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  // Filter products locally for instant response
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || p.category_name === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <span className="px-2.5 py-0.5 text-[9px] font-sans font-bold uppercase text-green-400 bg-green-950/45 border border-green-500/25 rounded">Estoque</span>
      case 'pre_order':
        return <span className="px-2.5 py-0.5 text-[9px] font-sans font-bold uppercase text-amber-400 bg-amber-950/45 border border-amber-500/25 rounded">Encomenda</span>
      case 'on_request':
        return <span className="px-2.5 py-0.5 text-[9px] font-sans font-bold uppercase text-blue-400 bg-blue-950/45 border border-blue-500/25 rounded">Consulta</span>
      default:
        return <span className="px-2.5 py-0.5 text-[9px] font-sans font-bold uppercase text-brand-silver bg-white/5 border border-white/10 rounded">{status}</span>
    }
  }

  return (
    <div className="space-y-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="font-title text-2xl sm:text-3xl text-white uppercase tracking-wide">Produtos</h1>
          <p className="font-sans text-xs text-brand-silver mt-1">Cadastre, edite e exclua os itens expostos em seu catálogo</p>
        </div>

        <Link
          href="/admin/produtos/novo"
          className="flex items-center gap-1.5 px-5 py-3 bg-brand-gold text-black font-sans text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 transition-all duration-300"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </Link>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-grow max-w-xl">
          <Search className="w-4 h-4 text-brand-silver absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar produto pelo nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-brand-black border border-white/10 rounded px-11 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
          />
        </div>

        {/* Category select filter */}
        <div className="flex items-center gap-4">
          <SlidersHorizontal className="w-4 h-4 text-brand-gold shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-brand-black border border-white/10 text-xs font-sans text-white rounded px-4 py-3 focus:outline-none focus:border-brand-gold cursor-pointer min-w-44"
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
          <p className="text-xs font-sans text-brand-silver mt-3">Buscando curadoria de produtos...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-white/5 rounded">
          <p className="text-xs font-sans text-brand-silver">Nenhum produto cadastrado com essas especificações.</p>
        </div>
      ) : (
        <div className="bg-brand-black border border-white/5 rounded-lg p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-sans text-brand-silver uppercase tracking-wider">
                  <th className="py-4 w-16">Foto</th>
                  <th className="py-4">Produto</th>
                  <th className="py-4">Categoria</th>
                  <th className="py-4">Preço Base</th>
                  <th className="py-4">Preço Promocional</th>
                  <th className="py-4">Estoque</th>
                  <th className="py-4">Ordem</th>
                  <th className="py-4">Status</th>
                  <th className="py-4">Destaque</th>
                  <th className="py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-sans text-brand-white">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    {/* Thumbnail */}
                    <td className="py-4">
                      <div className="relative w-10 h-10 rounded overflow-hidden border border-white/5 bg-black flex items-center justify-center">
                        {p.image_url ? (
                          <Image
                            src={p.image_url}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-brand-silver" />
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="py-4 font-semibold text-white max-w-sm truncate pr-4">
                      {p.name}
                    </td>

                    {/* Category */}
                    <td className="py-4 text-brand-silver">{p.category_name}</td>

                    {/* Base Price */}
                    <td className="py-4 font-medium">{formatPrice(p.price)}</td>

                    {/* Sale Price */}
                    <td className="py-4 text-brand-gold-light font-bold">
                      {p.sale_price ? formatPrice(p.sale_price) : '-'}
                    </td>

                    {/* Stock quantity */}
                    <td className="py-4 font-mono font-bold text-white">
                      {p.stock_quantity} un
                    </td>

                    {/* Display Order */}
                    <td className="py-4 font-mono text-brand-silver">{p.display_order}</td>

                    {/* Status */}
                    <td className="py-4">{getStatusBadge(p.status)}</td>

                    {/* Featured Toggle */}
                    <td className="py-4">
                      <button
                        onClick={() => handleToggleFeatured(p.id, p.featured)}
                        className={`p-1.5 rounded border transition-colors ${
                          p.featured
                            ? 'text-brand-gold border-brand-gold/30 hover:border-brand-gold bg-brand-gold/5'
                            : 'text-brand-silver border-white/5 hover:border-white/20'
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
                          className="p-2 text-brand-white hover:text-brand-gold bg-white/5 border border-white/10 hover:border-brand-gold/30 rounded transition-colors inline-block"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-2 text-brand-silver hover:text-red-500 bg-white/5 border border-white/10 hover:border-red-500/20 rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
