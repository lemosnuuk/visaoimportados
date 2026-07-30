'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { useCart } from '@/components/cart-context'
import { createClient } from '@/lib/supabase/client'
import { ShoppingBag, ArrowLeft, Send, Check, Camera, Sparkles, X } from 'lucide-react'

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
  category_id?: string
  category_name?: string
  category_slug?: string
  image_url: string
  images: string[]
  is_campaign?: boolean
  campaign_badge?: string | null
}

export default function ProductClientPage({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const [activeImage, setActiveImage] = useState(product.images?.[0] || product.image_url || '')
  
  // WhatsApp direct buy modal state
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false)
  const [buyPaymentMethod, setBuyPaymentMethod] = useState('Pix')

  const [relatedProducts, setRelatedProducts] = useState<any[]>([])
  const [isAdded, setIsAdded] = useState(false)

  useEffect(() => {
    async function loadRelated() {
      try {
        const supabase = createClient()
        
        let query = supabase
          .from('products')
          .select(`
            id, name, brand, slug, description, price, sale_price, status,
            categories(name, slug),
            product_images(image_url, display_order)
          `)
          .neq('id', product.id)
          .limit(4)

        if (product.category_id) {
          query = query.eq('category_id', product.category_id)
        }

        const { data: dbProducts } = await query

        if (dbProducts && dbProducts.length > 0) {
          const formatted = dbProducts.map((p: any) => {
            let imgUrl = 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&auto=format&fit=crop&q=80'
            if (p.product_images && p.product_images.length > 0) {
              const sorted = [...p.product_images].sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
              imgUrl = sorted[0].image_url
            }
            return {
              id: p.id,
              name: p.name,
              brand: p.brand || null,
              slug: p.slug,
              description: p.description || '',
              price: p.price !== null && p.price !== undefined ? Number(p.price) : null,
              sale_price: p.sale_price !== null && p.sale_price !== undefined ? Number(p.sale_price) : null,
              status: p.status,
              category_name: p.categories?.name || 'Importados',
              image_url: imgUrl
            }
          })
          setRelatedProducts(formatted)
        } else {
          setRelatedProducts([])
        }
      } catch (err) {
        console.error('Error fetching related products from Supabase', err)
      }
    }

    loadRelated()
  }, [product])

  // Single Direct Checkout on WhatsApp
  const handleDirectBuyWhatsApp = () => {
    const whatsappNumber = '5511999999999'
    const finalPrice = product.sale_price ?? product.price
    const priceText = (finalPrice === null || product.status === 'on_request')
      ? 'sob consulta de cotação'
      : `no valor de ${formatPrice(finalPrice)}`

    const text = encodeURIComponent(
      `Olá! Tenho interesse no seguinte produto exclusivo:\n\n` +
      `📦 *${product.name}*\n` +
      `🏷️ *Status:* ${getStatusText(product.status)}\n` +
      `💰 *Preço:* ${priceText}\n` +
      `💳 *Pretende pagar via:* ${buyPaymentMethod}\n\n` +
      `Poderia me passar mais informações sobre disponibilidade e prazos?`
    )
    setIsBuyModalOpen(false)
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank')
  }

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price ?? 0,
      sale_price: product.sale_price,
      image_url: product.image_url,
      status: product.status
    })
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return 'Sob Consulta'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_stock':
        return 'Disponível em Estoque'
      case 'pre_order':
        return 'Sob Encomenda (Importação)'
      case 'on_request':
        return 'Sob Consulta'
      default:
        return status
    }
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return (
          <span className="text-xs font-sans font-bold uppercase tracking-widest px-3.5 py-1 bg-green-950/70 text-green-400 border border-green-500/30 rounded">
            Em Estoque
          </span>
        )
      case 'pre_order':
        return (
          <span className="text-xs font-sans font-bold uppercase tracking-widest px-3.5 py-1 bg-amber-950/70 text-amber-400 border border-amber-500/30 rounded">
            Sob Encomenda
          </span>
        )
      case 'on_request':
        return (
          <span className="text-xs font-sans font-bold uppercase tracking-widest px-3.5 py-1 bg-blue-950/70 text-blue-400 border border-blue-500/30 rounded">
            Sob Consulta
          </span>
        )
      default:
        return null
    }
  }

  const isPriceConsultable = product.price === null || product.status === 'on_request' || (product.status === 'pre_order' && product.price === null)

  return (
    <>
      <Navbar />

      <main className="bg-black min-h-screen text-foreground pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          {/* BACK NAVIGATION */}
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 text-xs font-sans text-brand-silver hover:text-brand-gold transition-colors duration-300 mb-12 uppercase tracking-wider font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o catálogo
          </Link>

          {/* MAIN PRODUCT BLOCK */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
            {/* LEFT COLUMN: GALLERY */}
            <div className="flex flex-col gap-6">
              <div className="relative h-[550px] w-full overflow-hidden rounded-lg border border-white/10 bg-gradient-to-b from-brand-black via-zinc-950 to-black flex items-center justify-center p-6 group">
                <Image
                  src={activeImage}
                  alt={product.name}
                  fill
                  className="object-contain p-6 transition-all duration-500 group-hover:scale-105 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                  priority
                />
                {product.is_campaign && (
                  <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                    <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-black font-sans font-black text-xs uppercase px-3 py-1.5 rounded-lg shadow-lg shadow-amber-500/20 tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-black animate-pulse" />
                      {product.campaign_badge || 'Campanha Ativa'}
                    </div>
                    {product.price && product.sale_price && product.sale_price < product.price && (
                      <div className="bg-brand-gold text-black font-sans font-black text-xs uppercase px-3 py-1.5 rounded-lg shadow-lg shadow-brand-gold/20 tracking-wider">
                        -{Math.round(((product.price - product.sale_price) / product.price) * 100)}% OFF
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Thumbnails row */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {product.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(img)}
                      className={`relative w-24 h-24 rounded-lg border overflow-hidden shrink-0 transition-all duration-300 bg-brand-black p-1.5 ${
                        activeImage === img
                          ? 'border-brand-gold ring-2 ring-brand-gold/50 shadow-md shadow-brand-gold/10'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} Thumbnail ${index + 1}`}
                        fill
                        className="object-contain p-1"
                      />
                      {index === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-brand-gold text-black text-[9px] font-sans font-bold uppercase text-center py-0.5 z-10">
                          Capa
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: INFO */}
            <div className="flex flex-col justify-start">
              {product.is_campaign && (
                <div className="inline-flex items-center gap-1.5 text-xs font-sans font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-md mb-3 w-fit">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  {product.campaign_badge || 'Produto Selecionado em Campanha Ativa'}
                </div>
              )}

              {/* Category & Status */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="text-xs font-sans text-brand-gold uppercase tracking-widest font-bold">
                  {product.category_name} {product.brand && `• ${product.brand}`}
                </span>
                {renderStatusBadge(product.status)}
              </div>

              {/* Product Name */}
              <h1 className="font-title text-3xl sm:text-4xl md:text-5xl text-white uppercase tracking-wide mb-6 leading-tight">
                {product.name}
              </h1>

              {/* Price display */}
              <div className="mb-8 p-6 bg-brand-black border border-white/10 rounded-lg">
                <span className="text-xs font-sans text-slate-300 uppercase tracking-widest block mb-2 font-bold">
                  Valor do Produto
                </span>
                {isPriceConsultable ? (
                  <div className="space-y-1">
                    <span className="text-2xl sm:text-3xl font-sans font-bold text-brand-gold-light uppercase tracking-wider block">
                      {product.status === 'pre_order' ? 'Sob Encomenda (Sob Consulta)' : 'Sob Consulta'}
                    </span>
                    <p className="text-xs font-sans text-slate-300">
                      Entre em contato via WhatsApp para consultar o valor atualizado e prazos.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4 flex-wrap">
                      {product.sale_price ? (
                        <>
                          <span className="text-2xl sm:text-3xl font-sans font-bold text-brand-gold-light">
                            {formatPrice(product.sale_price)}
                          </span>
                          <span className="text-sm font-sans text-slate-400 line-through">
                            {formatPrice(product.price)}
                          </span>
                          {(product as any).is_campaign && product.price && product.price > product.sale_price && (
                            <span className="px-2.5 py-1 bg-red-600/90 text-white font-sans font-black text-xs uppercase tracking-wider rounded shadow-md">
                              -{Math.round(((product.price - product.sale_price) / product.price) * 100)}% OFF
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-2xl sm:text-3xl font-sans font-bold text-white">
                          {formatPrice(product.price)}
                        </span>
                      )}
                    </div>
                    
                    {/* Pix / Cartão Info */}
                    <div className="mt-2 text-xs font-sans text-brand-silver">
                      Valores referentes ao pagamento à vista via PIX.<br/>
                      Para pagamentos no cartão de crédito, consulte taxas.
                    </div>
                  </>
                )}
                <span className="text-[11px] font-sans text-slate-400 block mt-3">
                  * Valores sujeitos a alteração cambial ou de taxas aduaneiras.
                </span>
              </div>

              {/* Description */}
              <div className="mb-10">
                <h3 className="font-title text-xs text-white uppercase tracking-wider mb-3">Sobre o Produto</h3>
                <p className="font-sans text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {product.description || 'Nenhuma descrição adicional informada para este item exclusivo.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setIsBuyModalOpen(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-gold-gradient text-black font-sans font-bold text-[11px] sm:text-xs uppercase tracking-widest rounded hover:opacity-95 transition-all duration-300 shadow-lg shadow-brand-gold/10 text-center px-2 leading-tight"
                  >
                    <Send className="w-4 h-4 shrink-0" />
                    {isPriceConsultable ? 'Consultar Valor no WhatsApp' : 'Comprar pelo WhatsApp'}
                  </button>

                  <button
                    onClick={handleAddToCart}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 border font-sans font-bold text-[11px] sm:text-xs uppercase tracking-widest rounded transition-all duration-300 text-center px-2 leading-tight ${
                      isAdded
                        ? 'bg-green-950 border-green-500 text-green-400'
                        : 'bg-transparent border-white/20 text-white hover:border-brand-gold hover:text-brand-gold'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        Adicionado
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        Adicionar ao Carrinho
                      </>
                    )}
                  </button>
                </div>

                {/* Helper notice for photo via WhatsApp */}
                <p className="text-xs font-sans text-slate-300 mt-2 flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-lg">
                  <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Dica: Ao iniciar a conversa, fique à vontade para nos enviar a foto ou print do produto desejado para identificação imediata!</span>
                </p>
              </div>
            </div>
          </div>

          {/* RELATED PRODUCTS */}
          {relatedProducts.length > 0 && (
            <div className="border-t border-white/10 pt-16">
              <h2 className="font-title text-xl sm:text-2xl text-white uppercase tracking-wider mb-10">PRODUTOS RELACIONADOS</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                {relatedProducts.map((p) => {
                  const pConsultable = p.price === null || p.status === 'on_request'
                  return (
                    <div
                      key={p.id}
                      className="bg-brand-black border border-white/10 hover:border-brand-gold/40 rounded-lg overflow-hidden flex flex-col group transition-all duration-500 hover:shadow-[0_8px_30px_rgba(212,175,55,0.06)] hover:-translate-y-0.5"
                    >
                      <Link href={`/produto/${p.slug}`} className="relative h-64 overflow-hidden block">
                        <Image
                          src={p.image_url}
                          alt={p.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                      </Link>

                      <div className="p-5 flex flex-col flex-grow bg-gradient-to-b from-brand-black to-black/90">
                        <span className="text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-1.5 font-bold">
                          {p.category_name} {p.brand && `• ${p.brand}`}
                        </span>
                        <Link href={`/produto/${p.slug}`}>
                          <h3 className="font-title text-xs text-white mb-3 uppercase tracking-wide group-hover:text-brand-gold transition-colors duration-300 line-clamp-2 min-h-8 font-bold leading-tight">
                            {p.name}
                          </h3>
                        </Link>
                        <div className="mt-auto pt-3 border-t border-white/10">
                          {pConsultable ? (
                            <span className="text-xs font-title font-bold text-brand-gold-light uppercase tracking-widest block py-0.5">
                              Sob Consulta
                            </span>
                          ) : p.sale_price ? (
                            <div className="flex flex-col">
                              <span className="text-xs font-sans text-slate-400 line-through leading-none">
                                {formatPrice(p.price)}
                              </span>
                              <span className="text-base font-title font-black text-brand-gold-light tracking-tight mt-0.5">
                                {formatPrice(p.sale_price)}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span className="text-[9px] font-sans text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                                Valor
                              </span>
                              <span className="text-base font-title font-black text-white tracking-tight">
                                {formatPrice(p.price)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        {/* WhatsApp Checkout Modal */}
        {isBuyModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-brand-black border border-white/10 rounded-xl p-6 w-full max-w-sm flex flex-col relative gold-glow">
              <button
                onClick={() => setIsBuyModalOpen(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <h3 className="font-title text-lg text-brand-gold-light uppercase tracking-wider mb-2">Comprar Agora</h3>
              <p className="font-sans text-xs text-brand-silver mb-6">Como você gostaria de realizar o pagamento?</p>
              
              <div className="flex flex-col gap-4 mb-6">
                <label className="flex items-center gap-3 p-3 border border-white/10 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="Pix" 
                    checked={buyPaymentMethod === 'Pix'} 
                    onChange={(e) => setBuyPaymentMethod(e.target.value)}
                    className="accent-brand-gold w-4 h-4"
                  />
                  <span className="font-sans text-sm text-white">Pix (À vista)</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-white/10 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="Dinheiro" 
                    checked={buyPaymentMethod === 'Dinheiro'} 
                    onChange={(e) => setBuyPaymentMethod(e.target.value)}
                    className="accent-brand-gold w-4 h-4"
                  />
                  <span className="font-sans text-sm text-white">Dinheiro (À vista)</span>
                </label>
                <label className="flex items-center gap-3 p-3 border border-white/10 rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="Cartão de Crédito" 
                    checked={buyPaymentMethod === 'Cartão de Crédito'} 
                    onChange={(e) => setBuyPaymentMethod(e.target.value)}
                    className="accent-brand-gold w-4 h-4"
                  />
                  <div className="flex flex-col">
                    <span className="font-sans text-sm text-white">Cartão de Crédito</span>
                    <span className="font-sans text-[10px] text-brand-silver">Sujeito a taxas. Consulte no atendimento.</span>
                  </div>
                </label>
              </div>

              <button
                onClick={handleDirectBuyWhatsApp}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 hover:bg-green-500 rounded-lg text-white font-sans font-bold uppercase tracking-wider transition-all duration-300 shadow-md shadow-green-600/20"
              >
                <ShoppingBag className="w-5 h-5" />
                Continuar para WhatsApp
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  )
}
