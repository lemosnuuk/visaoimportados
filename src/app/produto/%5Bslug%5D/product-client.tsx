'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { useCart } from '@/components/cart-context'
import { createClient } from '@/lib/supabase/client'
import { ShoppingBag, ArrowLeft, Send, Check } from 'lucide-react'

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
  category_id?: string
  category_name?: string
  category_slug?: string
  image_url: string
  images: string[]
}

export default function ProductClientPage({ product }: { product: Product }) {
  const { addToCart } = useCart()
  const [activeImage, setActiveImage] = useState(product.images[0] || product.image_url)
  const [relatedProducts, setRelatedProducts] = useState<any[]>([])
  const [isAdded, setIsAdded] = useState(false)

  useEffect(() => {
    async function loadRelated() {
      try {
        const supabase = createClient()
        
        let query = supabase
          .from('products')
          .select(`
            id, name, slug, description, price, sale_price, status,
            categories(name, slug),
            product_images(image_url)
          `)
          .neq('id', product.id)
          .limit(4)

        if (product.category_id) {
          query = query.eq('category_id', product.category_id)
        }

        const { data: dbProducts } = await query

        if (dbProducts && dbProducts.length > 0) {
          const formatted = dbProducts.map((p: any) => {
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
              status: p.status,
              category_name: p.categories?.name || 'Importados',
              image_url: imgUrl
            }
          })
          setRelatedProducts(formatted)
        } else {
          // Generate static related products of same category
          // Simple mock filter
          const mockRelated = [
            {
              id: 'p7',
              name: 'Creed Aventus Eau de Parfum 100ml',
              slug: 'creed-aventus-eau-de-parfum-100ml',
              description: 'Um perfume icônico frutado rico, celebrando força, poder e sucesso.',
              price: 2490.00,
              sale_price: null,
              status: 'in_stock',
              category_name: 'Perfumes',
              image_url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&auto=format&fit=crop&q=80'
            },
            {
              id: 'p8',
              name: 'iPad Pro 13" M4 256GB Wi-Fi',
              slug: 'ipad-pro-13-m4-256gb',
              description: 'Incrivelmente fino, com o desempenho revolucionário do chip Apple M4 e tela Ultra Retina XDR.',
              price: 13200.00,
              sale_price: 12500.00,
              status: 'pre_order',
              category_name: 'Eletrônicos',
              image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80'
            }
          ].filter(p => p.category_name === product.category_name && p.slug !== product.slug)
          setRelatedProducts(mockRelated)
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
    const priceText = product.status === 'on_request'
      ? 'sob consulta de cotação'
      : `no valor de ${formatPrice(finalPrice)}`

    const text = encodeURIComponent(
      `Olá! Tenho interesse no seguinte produto exclusivo:\n\n` +
      `📦 *${product.name}*\n` +
      `🏷️ *Status:* ${getStatusText(product.status)}\n` +
      `💰 *Preço:* ${priceText}\n\n` +
      `Poderia me passar mais informações sobre disponibilidade e prazos?`
    )
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank')
  }

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      sale_price: product.sale_price,
      image_url: product.image_url,
      status: product.status
    })
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 2000)
  }

  const formatPrice = (price: number) => {
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
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest px-3 py-1 bg-green-950/50 text-green-400 border border-green-500/20 rounded">
            Em Estoque
          </span>
        )
      case 'pre_order':
        return (
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest px-3 py-1 bg-amber-950/50 text-amber-400 border border-amber-500/20 rounded">
            Sob Encomenda
          </span>
        )
      case 'on_request':
        return (
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest px-3 py-1 bg-blue-950/50 text-blue-400 border border-blue-500/20 rounded">
            Importação sob Consulta
          </span>
        )
      default:
        return null
    }
  }

  return (
    <>
      <Navbar />

      <main className="bg-black min-h-screen text-foreground pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          {/* BACK NAVIGATION */}
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 text-xs font-sans text-brand-silver hover:text-brand-gold transition-colors duration-300 mb-12 uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o catálogo
          </Link>

          {/* MAIN PRODUCT BLOCK */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
            {/* LEFT COLUMN: GALLERY */}
            <div className="flex flex-col gap-6">
              <div className="relative h-[550px] w-full overflow-hidden rounded-lg border border-white/5 bg-brand-black flex items-center justify-center">
                <Image
                  src={activeImage}
                  alt={product.name}
                  fill
                  className="object-cover transition-all duration-500 hover:scale-105"
                  priority
                />
              </div>

              {/* Thumbnails row */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {product.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(img)}
                      className={`relative w-24 h-24 rounded border overflow-hidden shrink-0 transition-all duration-300 ${
                        activeImage === img
                          ? 'border-brand-gold ring-1 ring-brand-gold'
                          : 'border-white/5 hover:border-white/20'
                      }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} Thumbnail ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: INFO */}
            <div className="flex flex-col justify-start">
              {/* Category & Status */}
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="text-xs font-sans text-brand-gold uppercase tracking-widest font-bold">
                  {product.category_name}
                </span>
                {renderStatusBadge(product.status)}
              </div>

              {/* Product Name */}
              <h1 className="font-title text-3xl sm:text-4xl md:text-5xl text-white uppercase tracking-wide mb-6 leading-tight">
                {product.name}
              </h1>

              {/* Price display */}
              <div className="mb-8 p-6 bg-brand-black border border-white/5 rounded-lg">
                <span className="text-[10px] font-sans text-brand-silver uppercase tracking-widest block mb-2">Valor Estimado</span>
                {product.status === 'on_request' ? (
                  <span className="text-2xl font-sans font-bold text-brand-gold-light uppercase tracking-wider">Cotação sob Consulta</span>
                ) : (
                  <div className="flex items-baseline gap-4">
                    {product.sale_price ? (
                      <>
                        <span className="text-2xl sm:text-3xl font-sans font-bold text-brand-gold-light">
                          {formatPrice(product.sale_price)}
                        </span>
                        <span className="text-sm font-sans text-brand-silver line-through">
                          {formatPrice(product.price)}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl sm:text-3xl font-sans font-bold text-white">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                )}
                <span className="text-[10px] font-sans text-brand-silver/50 block mt-3">
                  * Valores sujeitos a alteração cambial ou de taxas aduaneiras.
                </span>
              </div>

              {/* Description */}
              <div className="mb-10">
                <h3 className="font-title text-xs text-white uppercase tracking-wider mb-3">Sobre o Produto</h3>
                <p className="font-sans text-xs text-brand-silver/90 leading-relaxed whitespace-pre-line">
                  {product.description || 'Nenhuma descrição adicional informada para este item exclusivo.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleDirectBuyWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-gold-gradient text-black font-sans font-bold text-xs uppercase tracking-widest rounded hover:opacity-95 transition-all duration-300"
                >
                  <Send className="w-4.5 h-4.5" />
                  Comprar pelo WhatsApp
                </button>

                <button
                  onClick={handleAddToCart}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 border font-sans font-bold text-xs uppercase tracking-widest rounded transition-all duration-300 ${
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
            </div>
          </div>

          {/* RELATED PRODUCTS */}
          {relatedProducts.length > 0 && (
            <div className="border-t border-white/5 pt-16">
              <h2 className="font-title text-xl sm:text-2xl text-white uppercase tracking-wider mb-10">PRODUTOS RELACIONADOS</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
                {relatedProducts.map((p) => (
                  <div
                    key={p.id}
                    className="bg-brand-black border border-white/5 hover:border-white/10 rounded overflow-hidden flex flex-col group transition-all duration-300"
                  >
                    <Link href={`/produto/${p.slug}`} className="relative h-64 overflow-hidden block">
                      <Image
                        src={p.image_url}
                        alt={p.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </Link>

                    <div className="p-4 flex flex-col flex-grow">
                      <span className="text-[9px] font-sans text-brand-gold uppercase tracking-widest mb-1">{p.category_name}</span>
                      <Link href={`/produto/${p.slug}`}>
                        <h3 className="font-title text-[11px] text-white mb-2 uppercase tracking-wide group-hover:text-brand-gold transition-colors duration-300 line-clamp-2 min-h-6">
                          {p.name}
                        </h3>
                      </Link>
                      <span className="text-xs font-sans font-bold text-white mt-auto block">
                        {p.status === 'on_request' ? 'Sob Consulta' : formatPrice(p.sale_price ?? p.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
