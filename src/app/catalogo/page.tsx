'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { useCart } from '@/components/cart-context'
import { createClient } from '@/lib/supabase/client'
import { Search, SlidersHorizontal, Plus, ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react'

interface Product {
  id: string
  name: string
  brand?: string | null
  slug: string
  description: string
  price: number | null
  sale_price: number | null
  status: 'in_stock' | 'pre_order' | 'on_request'
  featured: boolean
  display_order: number
  category_name?: string
  category_slug?: string
  image_url: string
  is_campaign?: boolean
  campaign_badge?: string | null
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

  // Campaign Filter State
  const [activeCampaignFilter, setActiveCampaignFilter] = useState<{ id: string; name: string; badge_label: string } | null>(null)
  const [campaignProductIds, setCampaignProductIds] = useState<Set<string>>(new Set())
  const [campaignPricesMap, setCampaignPricesMap] = useState<Record<string, number>>({})

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
        const campanhaParam = searchParams.get('campanha')
        
        let cProdIds = new Set<string>()
        let cPrices: Record<string, number> = {}

        const nowIso = new Date().toISOString()

        // Check if there is a specific campaign param or active campaign
        if (campanhaParam) {
          const { data: dbCamp } = await supabase
            .from('campaigns')
            .select(`
              id, name, badge_label,
              campaign_products(product_id, campaign_price)
            `)
            .eq('slug', campanhaParam)
            .eq('is_active', true)
            .lte('start_date', nowIso)
            .gte('end_date', nowIso)
            .maybeSingle()

          if (dbCamp) {
            setActiveCampaignFilter({
              id: dbCamp.id,
              name: dbCamp.name,
              badge_label: dbCamp.badge_label
            })

            if (dbCamp.campaign_products) {
              dbCamp.campaign_products.forEach((cp: any) => {
                cProdIds.add(cp.product_id)
                if (cp.campaign_price) {
                  cPrices[cp.product_id] = Number(cp.campaign_price)
                }
              })
            }
            setCampaignProductIds(cProdIds)
            setCampaignPricesMap(cPrices)
          } else {
            setActiveCampaignFilter(null)
            setCampaignProductIds(new Set())
            setCampaignPricesMap({})
          }
        } else {
          setActiveCampaignFilter(null)

          // Fetch any active campaign currently running to apply active campaign discounts
          const { data: dbActiveCamps } = await supabase
            .from('campaigns')
            .select(`
              id, name, badge_label,
              campaign_products(product_id, campaign_price)
            `)
            .eq('is_active', true)
            .lte('start_date', nowIso)
            .gte('end_date', nowIso)
            .order('created_at', { ascending: false })
            .limit(1)

          if (dbActiveCamps && dbActiveCamps.length > 0) {
            const activeCamp = dbActiveCamps[0]
            if (activeCamp.campaign_products) {
              activeCamp.campaign_products.forEach((cp: any) => {
                cProdIds.add(cp.product_id)
                if (cp.campaign_price) {
                  cPrices[cp.product_id] = Number(cp.campaign_price)
                }
              })
            }
            setCampaignProductIds(cProdIds)
            setCampaignPricesMap(cPrices)
          } else {
            setCampaignProductIds(new Set())
            setCampaignPricesMap({})
          }
        }

        // 1. Fetch Categories
        const { data: dbCategories } = await supabase
          .from('categories')
          .select('id, name, slug')
          .order('name')
        
        // 2. Fetch Products with images ordered by display_order
        const { data: dbProducts } = await supabase
          .from('products')
          .select(`
            id, name, brand, slug, description, price, sale_price, status, featured, display_order,
            categories(name, slug),
            product_images(image_url, display_order)
          `)
          .order('display_order', { ascending: true })

        if (dbCategories && dbCategories.length > 0) {
          setCategories(dbCategories)
        } else {
          setCategories([])
        }

        if (dbProducts && dbProducts.length > 0) {
          let filteredList = dbProducts

          // If campaign filter is active in URL, filter only products belonging to campaign
          if (campanhaParam && cProdIds.size > 0) {
            filteredList = dbProducts.filter((p: any) => cProdIds.has(p.id))
          }

          const formattedProducts = filteredList.map((p: any) => {
            let imgUrl = 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&auto=format&fit=crop&q=80'
            if (p.product_images && p.product_images.length > 0) {
              const sorted = [...p.product_images].sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
              imgUrl = sorted[0].image_url
            }

            const basePrice = p.price !== null && p.price !== undefined ? Number(p.price) : null
            let effectiveSalePrice: number | null = p.sale_price !== null && p.sale_price !== undefined ? Number(p.sale_price) : null
            
            if (cPrices[p.id]) {
              effectiveSalePrice = cPrices[p.id]
            }

            return {
              id: p.id,
              name: p.name,
              brand: p.brand || null,
              slug: p.slug,
              description: p.description || '',
              price: basePrice,
              sale_price: effectiveSalePrice,
              status: p.status as any,
              featured: p.featured,
              display_order: p.display_order,
              category_name: p.categories?.name || 'Importados',
              category_slug: p.categories?.slug || 'importados',
              image_url: imgUrl,
              is_campaign: !!cPrices[p.id],
              campaign_badge: cPrices[p.id] ? activeCampaignFilter?.badge_label : null
            }
          })
          setProducts(formattedProducts)
        } else {
          setProducts([])
        }
      } catch (err) {
        console.error('Error querying Supabase in Catalog.', err)
        setCategories([])
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [searchParams])

  // Sync Search & Filter to URL params
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
                          (product.brand && product.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return 'Sob Consulta'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return (
          <span className="text-[9px] font-sans font-bold uppercase tracking-widest px-2 py-0.5 bg-green-950/70 text-green-400 border border-green-500/30 rounded">
            Em Estoque
          </span>
        )
      case 'pre_order':
        return (
          <span className="text-[9px] font-sans font-bold uppercase tracking-widest px-2 py-0.5 bg-amber-950/70 text-amber-400 border border-amber-500/30 rounded">
            Sob Encomenda
          </span>
        )
      case 'on_request':
        return (
          <span className="text-[9px] font-sans font-bold uppercase tracking-widest px-2 py-0.5 bg-blue-950/70 text-blue-400 border border-blue-500/30 rounded">
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
        <div className="flex flex-col gap-4 mb-8">
          <span className="text-brand-gold text-xs font-sans font-bold tracking-widest uppercase">Curadoria Completa</span>
          <h1 className="font-title text-3xl sm:text-5xl text-white uppercase tracking-wide">CATÁLOGO EXCLUSIVO</h1>
          <div className="w-12 h-0.5 bg-brand-gold" />
        </div>

        {/* CAMPAIGN BANNER IF FILTERED */}
        {activeCampaignFilter && (
          <div className="mb-10 p-6 bg-gradient-to-r from-brand-gold/20 via-brand-black to-black border border-brand-gold/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center shrink-0 text-brand-gold">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-sans font-bold text-brand-gold uppercase tracking-widest block">
                  Campanha Promocional Ativa
                </span>
                <h2 className="text-xl font-title text-white uppercase font-bold mt-0.5">
                  {activeCampaignFilter.name}
                </h2>
                <p className="text-xs font-sans text-slate-300 mt-1">
                  Exibindo exclusivamente as ofertas selecionadas para esta promoção.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setActiveCampaignFilter(null)
                const params = new URLSearchParams(window.location.search)
                params.delete('campanha')
                router.replace(`/catalogo?${params.toString()}`)
              }}
              className="shrink-0 w-full sm:w-auto px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-sans text-xs font-bold uppercase tracking-wider rounded-lg border border-white/20 flex items-center justify-center gap-2 transition-all duration-300"
            >
              <X className="w-4 h-4" />
              Ver Todo o Catálogo
            </button>
          </div>
        )}

        {/* SEARCH & FILTERS BAR */}
        <div className="flex flex-col lg:flex-row gap-6 mb-12 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-grow max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, marca ou descrição..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-brand-black border border-white/15 rounded px-11 py-3.5 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
            />
            {searchTerm && (
              <button 
                onClick={() => handleSearchChange('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Indicators */}
          <div className="flex items-center gap-3 text-slate-300 text-xs font-sans font-medium">
            <SlidersHorizontal className="w-4 h-4 text-brand-gold" />
            <span>Exibindo {filteredProducts.length} produtos encontrados</span>
          </div>
        </div>

        {/* CATEGORY SELECTOR PILLS */}
        <div className="flex flex-wrap gap-2.5 mb-12 border-b border-white/10 pb-8">
          <button
            onClick={() => handleCategoryChange('all')}
            className={`px-5 py-2.5 rounded text-xs font-sans font-bold uppercase tracking-wider transition-all duration-300 border ${
              selectedCategory === 'all'
                ? 'bg-brand-gold text-black border-brand-gold'
                : 'bg-brand-black text-white border-white/10 hover:border-brand-gold/40'
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
                  : 'bg-brand-black text-white border-white/10 hover:border-brand-gold/40'
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
            <p className="text-xs font-sans text-slate-400 mt-4">Carregando catálogo...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-32 border border-dashed border-white/10 rounded-lg">
            <p className="text-sm font-sans text-slate-300 mb-4">Nenhum produto encontrado com os filtros selecionados.</p>
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
              {paginatedProducts.map((product) => {
                const isConsultable = product.price === null || product.status === 'on_request' || (product.status === 'pre_order' && product.price === null)

                return (
                  <div
                    key={product.id}
                    className="bg-brand-black border border-white/10 hover:border-brand-gold/40 rounded-lg overflow-hidden flex flex-col group transition-all duration-500 hover:shadow-[0_8px_30px_rgba(212,175,55,0.06)] hover:-translate-y-0.5"
                  >
                    <Link href={`/produto/${product.slug}`} className="relative h-72 overflow-hidden block">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-contain p-4 group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="absolute top-4 left-4 z-10">
                        {renderStatusBadge(product.status)}
                      </div>
                      {product.is_campaign && (
                        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-1.5">
                          <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-black font-sans font-black text-[10px] uppercase px-2.5 py-1 rounded shadow-lg shadow-amber-500/20 tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-black animate-pulse" />
                            {product.campaign_badge || 'Campanha Ativa'}
                          </div>
                          {product.price && product.sale_price && product.sale_price < product.price && (
                            <div className="bg-brand-gold text-black font-sans font-black text-xs uppercase px-2.5 py-1 rounded shadow-lg shadow-brand-gold/20 tracking-wider">
                              -{Math.round(((product.price - product.sale_price) / product.price) * 100)}% OFF
                            </div>
                          )}
                        </div>
                      )}
                    </Link>

                    <div className="p-6 flex flex-col flex-grow bg-gradient-to-b from-brand-black to-black/90">
                      {product.is_campaign && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-sans font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded mb-2 w-fit">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          {product.campaign_badge || 'Oferta de Campanha'}
                        </span>
                      )}
                      <span className="text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-1.5 font-bold">
                        {product.category_name} {product.brand && `• ${product.brand}`}
                      </span>
                      <Link href={`/produto/${product.slug}`}>
                        <h3 className="font-title text-sm text-white mb-2 uppercase tracking-wide group-hover:text-brand-gold transition-colors duration-300 min-h-10 line-clamp-2 font-bold leading-tight">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="font-sans text-xs text-slate-300 line-clamp-2 mb-5 leading-relaxed">
                        {product.description}
                      </p>

                      <div className="mt-auto flex items-center justify-between pt-5 border-t border-white/10">
                        <div className="flex flex-col justify-center">
                          {isConsultable ? (
                            <span className="text-xs font-title font-bold text-brand-gold-light uppercase tracking-widest block py-1">
                              Sob Consulta
                            </span>
                          ) : product.sale_price ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-sans text-slate-400 line-through block leading-none">
                                  {formatPrice(product.price)}
                                </span>
                                {product.is_campaign && product.price && product.sale_price < product.price && (
                                  <span className="text-[9px] font-sans font-bold text-red-400 bg-red-950/60 border border-red-500/30 px-1 py-0.2 rounded">
                                    -{Math.round(((product.price - product.sale_price) / product.price) * 100)}%
                                  </span>
                                )}
                              </div>
                              <span className="text-xl font-title font-black text-brand-gold-light tracking-tight block">
                                {formatPrice(product.sale_price)}
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="text-[9px] font-sans text-slate-400 uppercase tracking-widest block leading-none mb-0.5">
                                Valor
                              </span>
                              <span className="text-xl font-title font-black text-white tracking-tight block">
                                {formatPrice(product.price)}
                              </span>
                            </div>
                          )}
                          
                          {product.status !== 'on_request' && product.price && (
                            <p className="text-[8px] font-sans text-brand-silver/70 leading-tight mt-1">
                              À vista (PIX). Cartão c/ taxa.
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => {
                            addToCart({
                              id: product.id,
                              name: product.name,
                              slug: product.slug,
                              price: product.price ?? 0,
                              sale_price: product.sale_price,
                              image_url: product.image_url,
                              status: product.status
                            })
                          }}
                          className="p-3 bg-white/5 border border-white/10 hover:border-brand-gold hover:bg-gold-gradient hover:text-black rounded-lg text-white transition-all duration-300 shadow-md hover:shadow-brand-gold/20"
                          title="Adicionar ao Carrinho"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
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
                
                <span className="font-sans text-xs text-slate-300 font-medium tracking-widest uppercase">
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
