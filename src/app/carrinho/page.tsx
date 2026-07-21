'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { useCart } from '@/components/cart-context'
import { ArrowLeft, Trash2, Plus, Minus, Send, ShoppingBag } from 'lucide-react'

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, totalPrice, totalItems, clearCart } = useCart()

  // Form State
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  // Submit and open WhatsApp with dynamic message
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0 || !nome || !telefone) return

    const whatsappNumber = '5518997190799' // Official company number
    
    // Compile items list
    const itemsList = cart.map((item) => {
      const priceText = item.status === 'on_request'
        ? '(Importação sob Consulta)'
        : formatPrice(item.sale_price ?? item.price)
      return `${item.quantity}x ${item.name} [${priceText}]`
    }).join('\n')

    // Check if there are items sob consulta in the cart
    const hasOnRequestItems = cart.some(item => item.status === 'on_request')
    const totalText = hasOnRequestItems
      ? `${formatPrice(totalPrice)} + itens sob consulta`
      : formatPrice(totalPrice)

    const text = encodeURIComponent(
      `Olá.\n` +
      `Tenho interesse nos seguintes produtos:\n\n` +
      `${itemsList}\n\n` +
      `*Total estimado:* ${totalText}\n\n` +
      `👤 *Nome:* ${nome}\n` +
      `📞 *Telefone:* ${telefone}\n\n` +
      `Aguardo confirmação e instruções para a importação e entrega.`
    )

    // Clear cart after checkout
    clearCart()
    
    // Open WhatsApp
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank')
  }

  return (
    <>
      <Navbar />

      <main className="bg-black min-h-screen text-foreground pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          {/* HEADER */}
          <div className="flex flex-col gap-4 mb-12">
            <span className="text-brand-gold text-[10px] font-sans font-bold tracking-widest uppercase">Sacola de Pedido</span>
            <h1 className="font-title text-3xl sm:text-5xl text-white uppercase tracking-wide">CARRINHO INTELIGENTE</h1>
            <div className="w-12 h-0.5 bg-brand-gold" />
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-white/5 rounded-lg flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 text-brand-gold">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="font-sans text-sm text-brand-silver mb-6">Seu carrinho de importados está vazio.</p>
              <Link
                href="/catalogo"
                className="px-8 py-3.5 bg-gold-gradient text-black font-sans font-bold text-xs uppercase tracking-widest rounded hover:opacity-90 transition-all duration-300"
              >
                Explorar Catálogo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
              {/* LEFT: PRODUCTS LIST */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="font-sans text-xs uppercase tracking-wider text-brand-silver">Item</span>
                  <span className="font-sans text-xs uppercase tracking-wider text-brand-silver">Subtotal</span>
                </div>

                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-white/5"
                  >
                    {/* INFO */}
                    <div className="flex gap-4 items-center">
                      <div className="relative w-20 h-20 rounded border border-white/5 overflow-hidden shrink-0 bg-brand-black">
                        <Image
                          src={item.image_url || 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&auto=format&fit=crop&q=80'}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      
                      <div>
                        <h3 className="font-title text-xs text-white uppercase tracking-wider line-clamp-2 max-w-sm">
                          {item.name}
                        </h3>
                        <span className="text-[10px] font-sans text-brand-gold mt-1 block">
                          {item.status === 'on_request' || !item.price ? 'Sob Consulta' : formatPrice(item.sale_price ?? item.price)}
                        </span>
                      </div>
                    </div>

                    {/* QUANTITY AND SUBTOTAL */}
                    <div className="flex items-center justify-between sm:justify-end gap-12 w-full sm:w-auto">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-white/10 rounded overflow-hidden bg-brand-black">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 text-brand-silver hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-4 text-xs font-sans font-bold text-white min-w-8 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 text-brand-silver hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="flex items-center gap-6">
                        <span className="font-sans text-xs font-bold text-white min-w-[80px] text-right">
                          {item.status === 'on_request'
                            ? 'Sob Consulta'
                            : formatPrice((item.sale_price ?? item.price) * item.quantity)
                          }
                        </span>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-brand-silver hover:text-red-500 transition-colors"
                          title="Remover produto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <Link
                  href="/catalogo"
                  className="inline-flex items-center gap-2 text-xs font-sans text-brand-silver hover:text-brand-gold transition-colors duration-300 uppercase tracking-wider mt-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Continuar Escolhendo
                </Link>
              </div>

              {/* RIGHT: ORDER SUMMARY AND CLIENT INFO FORM */}
              <div className="p-8 bg-brand-black border border-white/5 rounded-lg h-fit gold-glow">
                <h3 className="font-title text-sm text-white uppercase tracking-wider mb-6 pb-4 border-b border-white/5">
                  Resumo do Pedido
                </h3>

                {/* Metrics */}
                <div className="space-y-4 mb-8 text-xs font-sans">
                  <div className="flex justify-between text-brand-silver">
                    <span>Itens selecionados</span>
                    <span>{totalItems}</span>
                  </div>
                  <div className="flex justify-between text-brand-silver">
                    <span>Prazo estimado</span>
                    <span>A combinar no atendimento</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-4 border-t border-white/5 text-white font-bold">
                    <span className="font-title uppercase text-xs">Total Estimado</span>
                    <span className="text-lg text-brand-gold-light">{formatPrice(totalPrice)}</span>
                  </div>
                  {cart.some(item => item.status === 'on_request') && (
                    <span className="text-[10px] text-brand-gold/80 block italic">
                      * O total não inclui itens marcados sob consulta.
                    </span>
                  )}
                </div>

                {/* FORM */}
                <form onSubmit={handleCheckoutSubmit} className="space-y-6 pt-6 border-t border-white/5">
                  <h4 className="font-title text-xs text-white uppercase tracking-wider">Dados para Atendimento</h4>
                  
                  <div>
                    <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-2">Seu Nome *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: João da Silva"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-2">WhatsApp de Contato *</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ex: (18) 99719-0799"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-4 bg-gold-gradient text-black font-sans font-bold text-xs uppercase tracking-widest rounded hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-brand-gold/10"
                  >
                    <Send className="w-4 h-4" />
                    Finalizar pelo WhatsApp
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
