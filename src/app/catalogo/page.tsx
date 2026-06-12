'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { useCart } from '@/components/cart-context'
import { createClient } from '@/lib/supabase/client'
import { Search, SlidersHorizontal, Plus, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  sale_price: number | null
  status: 'in_stock' | 'pre_order' | 'on_request'
  featured: boolean
  display_order: number
  category_name?: string
  category_slug?: string
  image_url: string
}

interface Category {
  id: string
  name: string
  slug: string
}



function CatalogContent() {
  const { addToCart } = useCart()
  const searchParams = useSearchParams()
  const router = useRouter()

  // State
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Filter State
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  // Read URL search params
  useEffect(() => {
    const catParam = searchParams.get('categoria')
    const searchParam = searchParams.get('busca')
    if (catParam) setSelectedCategory(catParam)
    if (searchParam) setSearchTerm(searchParam)
  }, [searchParams])

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        
        // 1. Fetch Categories
        const { data: dbCategories } = await supabase
          .from('categories')
          .select('id, name, slug')
          .order('name')
        
        // 2. Fetch Products
        const { data: dbProducts } = await supabase
          .from('products')
          .select(`
            id, name, slug, description, price, sale_price, status, featured, display_order,
            categories(name, slug),
            product_images(image_url)
          `)
          .order('display_order', { ascending: true })

        if (dbCategories && dbCategories.length > 0) {
          setCategories(dbCategories)
        } else {
          setCategories([])
        }

        if (dbProducts && dbProducts.length > 0) {
          const formattedProducts = dbProducts.map((p: any) => {
            const imgUrl = p.product_images && p.product_images.length > 0
              ? p.product_images[0].image_url
              : 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&auto=format&fit=crop&q=80'
            return {
              id: p.id,
              name: p.name,
              slug: p.slug,
              description: p.description || '',
              price: Number(p.price),
              sale_price: p.sale_price ? Number(p.sale_price) : null,
              status: p.status as any,
              featured: p.featured,
              display_order: p.display_order,
              category_name: p.categories?.name || 'Importados',
              category_slug: p.categories?.slug || 'importados',
              image_url: imgUrl
            }
          })
          setProducts(formattedProducts)
        } else {
          setProducts([])
        }
      } catch (err) {
        console.error('Error querying Supabase in Catalog, fall backing.', err)
        setCategories([])
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Sync Search & Filter to URL params for SEO & Shareability
  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug)
    setCurrentPage(1)
    
    const params = new URLSearchParams(window.location.search)
    if (slug === 'all') {
      params.delete('categoria')
    } else {
      params.set('categoria', slug)
    }
    router.replace(`/catalogo?${params.toString()}`)
  }

  const handleSearchChange = (val: string) => {
    setSearchTerm(val)
    setCurrentPage(1)

    const params = new URLSearchParams(window.location.search)
    if (val === '') {
      params.delete('busca')
    } else {
      params.set('busca', val)
    }
    router.replace(`/catalogo?${params.toString()}`)
  }

  // Filter logic
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = selectedCategory === 'all' || product.category_slug === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return (
          <span className="text-[9px] font-sans font-bold uppercase tracking-widest px-2 py-0.5 bg-green-950/60 text-green-400 border border-green-500/20 rounded">
            Em Estoque
          </span>
        )
      case 'pre_order':
        return (
          <span className="text-[9px] font-sans font-bold uppercase tracking-widest px-2 py-0.5 bg-amber-950/60 text-amber-400 border border-amber-500/20 rounded">
            Sob Encomenda
          </span>
        )
      case 'on_request':
        return (
          <span className="text-[9px] font-sans font-bold uppercase tracking-widest px-2 py-0.5 bg-blue-950/60 text-blue-400 border border-blue-500/20 rounded">
            Sob Consulta
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-black min-h-screen text-foreground pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6">
        {/* PAGE HEADER */}
        <div className="flex flex-col gap-4 mb-12">
          <span className="text-brand-gold text-[10px] font-sans font-bold tracking-widest uppercase">Curadoria Completa</span>
          <h1 className="font-title text-3xl sm:text-5xl text-white uppercase tracking-wide">CATÁLOGO EXCLUSIVO</h1>
          <div className="w-12 h-0.5 bg-brand-gold" />
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="flex flex-col lg:flex-row gap-6 mb-12 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-grow max-w-xl">
            <Search className="w-4 h-4 text-brand-silver absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, marca ou descrição..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-brand-black border border-white/10 rounded px-11 py-3.5 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
            />
            {searchTerm && (
              <button 
                onClick={() => handleSearchChange('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-silver hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Indicators */}
          <div className="flex items-center gap-3 text-brand-silver text-xs font-sans">
            <SlidersHorizontal className="w-4 h-4 text-brand-gold" />
            <span>Exibindo {filteredProducts.length} produtos encontrados</span>
          </div>
        </div>

        {/* CATEGORY SELECTOR PILLS */}
        <div className="flex flex-wrap gap-2.5 mb-12 border-b border-white/5 pb-8">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`px-5 py-2.5 rounded text-xs font-sans font-bold uppercase tracking-wider transition-all duration-300 border ${
              selectedCategory === 'all'
                ? 'bg-brand-gold text-black border-brand-gold'
                : 'bg-brand-black text-brand-white border-white/5 hover:border-brand-gold/40'
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.slug)}
              className={`px-5 py-2.5 rounded text-xs font-sans font-bold uppercase tracking-wider transition-all duration-300 border ${
                selectedCategory === cat.slug
                  ? 'bg-brand-gold text-black border-brand-gold'
                  : 'bg-brand-black text-brand-white border-white/5 hover:border-brand-gold/40'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* PRODUCTS GRID */}
        {loading ? (
          <div className="text-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-brand-gold mx-auto" />
            <p className="text-xs font-sans text-brand-silver mt-4">Carregando catálogo...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-white/5 rounded-lg">
            <p className="text-sm font-sans text-brand-silver mb-4">Nenhum produto encontrado com os filtros selecionados.</p>
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategory('all')
                router.replace('/catalogo')
              }}
              className="px-6 py-3 bg-brand-gold text-black text-xs font-sans font-bold uppercase tracking-wider rounded"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-16">
              {paginatedProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-brand-black border border-white/5 hover:border-white/10 rounded overflow-hidden flex flex-col group transition-all duration-300"
                >
                  <Link href={`/produto/${product.slug}`} className="relative h-72 overflow-hidden block">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4 z-10">
                      {renderStatusBadge(product.status)}
                    </div>
                  </Link>

                  <div className="p-5 flex flex-col flex-grow">
                    <span className="text-[9px] font-sans text-brand-gold uppercase tracking-widest mb-1">{product.category_name}</span>
                    <Link href={`/produto/${product.slug}`}>
                      <h3 className="font-title text-xs text-white mb-2 uppercase tracking-wide group-hover:text-brand-gold transition-colors duration-300 min-h-8 line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="font-sans text-[11px] text-brand-silver/65 line-clamp-2 mb-4">
                      {product.description}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex flex-col">
                        {product.sale_price ? (
                          <>
                            <span className="text-[9px] font-sans text-brand-silver line-through">{formatPrice(product.price)}</span>
                            <span className="text-xs font-sans font-bold text-brand-gold-light">{formatPrice(product.sale_price)}</span>
                          </>
                        ) : (
                          <span className="text-xs font-sans font-bold text-white">
                            {product.status === 'on_request' ? 'Sob Consulta' : formatPrice(product.price)}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          addToCart({
                            id: product.id,
                            name: product.name,
                            slug: product.slug,
                            price: product.price,
                            sale_price: product.sale_price,
                            image_url: product.image_url,
                            status: product.status
                          })
                        }}
                        className="p-2 bg-white/5 border border-white/10 hover:border-brand-gold hover:bg-brand-gold hover:text-black rounded text-white transition-all duration-300"
                        title="Adicionar ao Carrinho"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-6">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="p-3 rounded border border-white/10 hover:border-brand-gold text-white disabled:opacity-40 disabled:hover:border-white/10 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="font-sans text-xs text-brand-silver tracking-widest uppercase">
                  Página {currentPage} de {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="p-3 rounded border border-white/10 hover:border-brand-gold text-white disabled:opacity-40 disabled:hover:border-white/10 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function Catalog() {
  return (
    <>
      <Navbar />
      <Suspense fallback={
        <div className="bg-black min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-gold" />
        </div>
      }>
        <CatalogContent />
      </Suspense>
      <Footer />
    </>
  )
}
