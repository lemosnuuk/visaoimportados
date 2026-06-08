'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { useCart } from '@/components/cart-context'
import { createClient } from '@/lib/supabase/client'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { 
  ShieldCheck, 
  Truck, 
  UserCheck, 
  Sparkles, 
  HelpCircle, 
  TrendingUp, 
  ArrowRight, 
  Send,
  MessageSquare,
  Instagram,
  Mail,
  MapPin,
  Plus,
  Globe,
  Search,
  Compass,
  ShoppingBag
} from 'lucide-react'

// Define Types
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
  image_url: string
}

interface Category {
  id: string
  name: string
  slug: string
}

// Fallback Mock Categories
const MOCK_CATEGORIES = [
  { id: '1', name: 'Perfumes', slug: 'perfumes', img: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop&q=80' },
  { id: '2', name: 'Eletrônicos', slug: 'eletronicos', img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80' },
  { id: '3', name: 'Scooters', slug: 'scooters', img: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=600&auto=format&fit=crop&q=80' },
  { id: '4', name: 'Informática', slug: 'informatica', img: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80' },
  { id: '5', name: 'Games', slug: 'games', img: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&auto=format&fit=crop&q=80' },
  { id: '6', name: 'Smart Home', slug: 'smart-home', img: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&auto=format&fit=crop&q=80' },
  { id: '7', name: 'Gadgets', slug: 'gadgets', img: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=600&auto=format&fit=crop&q=80' },
  { id: '8', name: 'Acessórios', slug: 'acessorios', img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80' },
  { id: '9', name: 'Novidades', slug: 'novidades', img: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&auto=format&fit=crop&q=80' },
]

// Fallback Mock Products
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Bleu de Chanel Parfum 100ml',
    slug: 'bleu-de-chanel-parfum-100ml',
    description: 'Um perfume amadeirado aromático intenso e sofisticado para homens exigentes.',
    price: 949.00,
    sale_price: 899.00,
    status: 'in_stock',
    featured: true,
    display_order: 1,
    category_name: 'Perfumes',
    image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'p2',
    name: 'iPhone 16 Pro Max 256GB Gold Titanium',
    slug: 'iphone-16-pro-max-256gb-gold',
    description: 'O iPhone definitivo com tela Super Retina XDR de 6.9 polegadas, câmera de 48MP e chip A18 Pro.',
    price: 9899.00,
    sale_price: null,
    status: 'pre_order',
    featured: true,
    display_order: 2,
    category_name: 'Eletrônicos',
    image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'p3',
    name: 'Scooter Elétrica Kaabo Mantis King GT',
    slug: 'scooter-eletrica-kaabo-mantis-king-gt',
    description: 'Desempenho e luxo off-road com velocidade máxima de 70km/h e suspensão hidráulica ajustável.',
    price: 13900.00,
    sale_price: 12900.00,
    status: 'on_request',
    featured: true,
    display_order: 3,
    category_name: 'Scooters',
    image_url: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'p4',
    name: 'MacBook Pro M4 Pro 16" Space Black',
    slug: 'macbook-pro-m4-pro-16-space-black',
    description: 'Superpoderoso para fluxos de trabalho avançados com chip M4 Pro, 24GB de RAM e 512GB SSD.',
    price: 24999.00,
    sale_price: null,
    status: 'pre_order',
    featured: true,
    display_order: 4,
    category_name: 'Informática',
    image_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'p5',
    name: 'PlayStation 5 Pro 2TB',
    slug: 'playstation-5-pro-2tb',
    description: 'A experiência de jogo definitiva com ray tracing avançado, taxas de quadros super altas e 2TB de armazenamento.',
    price: 6999.00,
    sale_price: null,
    status: 'in_stock',
    featured: true,
    display_order: 5,
    category_name: 'Games',
    image_url: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: 'p6',
    name: 'Apple Watch Ultra 2 Ocean Band',
    slug: 'apple-watch-ultra-2-ocean-band',
    description: 'O relógio de aventura definitivo com caixa de titânio de 49 mm, GPS de dupla frequência e bateria de até 36 horas.',
    price: 7499.00,
    sale_price: 6999.00,
    status: 'in_stock',
    featured: true,
    display_order: 6,
    category_name: 'Gadgets',
    image_url: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=600&auto=format&fit=crop&q=80'
  }
]

// Minimalist Curation Info
export default function Home() {
  const { addToCart } = useCart()
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Hero showcase active index
  const [activeHeroIndex, setActiveHeroIndex] = useState(0)

  // Cotação Sob Demanda Form State
  const [cotacaoProduto, setCotacaoProduto] = useState('')
  const [cotacaoLink, setCotacaoLink] = useState('')
  const [cotacaoObs, setCotacaoObs] = useState('')

  // Contato Form State
  const [contatoNome, setContatoNome] = useState('')
  const [contatoEmail, setContatoEmail] = useState('')
  const [contatoMensagem, setContatoMensagem] = useState('')

  // Scroll Parallax variables
  const { scrollY } = useScroll()
  const yBg = useTransform(scrollY, [0, 600], [0, 200])
  const yText = useTransform(scrollY, [0, 500], [0, -80])
  const opacityHero = useTransform(scrollY, [0, 450], [1, 0])

  // Top products displayed in the hero section
  const heroProducts = featuredProducts.length > 0 ? featuredProducts.slice(0, 3) : MOCK_PRODUCTS.slice(0, 3)

  // Auto-play hero showcase
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % heroProducts.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [heroProducts.length])

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        
        // 1. Fetch Categories
        const { data: dbCategories, error: catError } = await supabase
          .from('categories')
          .select('id, name, slug')
          .order('name')
        
        // 2. Fetch Featured Products with their images
        const { data: dbProducts, error: prodError } = await supabase
          .from('products')
          .select(`
            id, name, slug, description, price, sale_price, status, featured, display_order,
            categories(name),
            product_images(image_url)
          `)
          .eq('featured', true)
          .order('display_order', { ascending: true })

        if (dbCategories && dbCategories.length > 0) {
          setCategories(dbCategories)
        } else {
          setCategories(MOCK_CATEGORIES)
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
              image_url: imgUrl
            }
          })
          setFeaturedProducts(formattedProducts)
        } else {
          setFeaturedProducts(MOCK_PRODUCTS)
        }
      } catch (err) {
        console.error('Error fetching data from Supabase, using mock data.', err)
        setCategories(MOCK_CATEGORIES)
        setFeaturedProducts(MOCK_PRODUCTS)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Send Demand Quote to WhatsApp
  const handleCotacaoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cotacaoProduto) return

    const whatsappNumber = '5511999999999' // Official company number
    const text = encodeURIComponent(
      `Olá, gostaria de solicitar uma cotação para o seguinte produto:\n\n` +
      `📦 *Produto:* ${cotacaoProduto}\n` +
      `🔗 *Link de referência:* ${cotacaoLink || 'Não informado'}\n` +
      `📝 *Observações:* ${cotacaoObs || 'Nenhuma'}\n\n` +
      `Aguardo retorno com a cotação estimada!`
    )
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank')
  }

  // Send Contact message to WhatsApp
  const handleContatoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!contatoNome || !contatoMensagem) return

    const whatsappNumber = '5511999999999'
    const text = encodeURIComponent(
      `Olá, meu nome é *${contatoNome}* (${contatoEmail || 'email não informado'}).\n\n` +
      `Mensagem:\n${contatoMensagem}`
    )
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank')
  }

  // Helper for Status badges
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return (
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest px-2.5 py-1 bg-green-950/50 text-green-400 border border-green-500/20 rounded">
            Em Estoque
          </span>
        )
      case 'pre_order':
        return (
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest px-2.5 py-1 bg-amber-950/50 text-amber-400 border border-amber-500/20 rounded">
            Sob Encomenda
          </span>
        )
      case 'on_request':
        return (
          <span className="text-[10px] font-sans font-bold uppercase tracking-widest px-2.5 py-1 bg-blue-950/50 text-blue-400 border border-blue-500/20 rounded">
            Sob Consulta
          </span>
        )
      default:
        return null
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  return (
    <>
      <Navbar />

      {/* HERO SECTION */}
      <section id="home" className="relative min-h-screen lg:h-screen w-full overflow-hidden bg-black flex flex-col justify-center py-24 lg:py-0">
        {/* Cinematic Parallax Background */}
        <motion.div 
          style={{ y: yBg, opacity: opacityHero }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/60 to-black z-10" />
          <Image
            src="/assets/hero_bg.png"
            alt="Visão Importados Background"
            fill
            priority
            className="object-cover scale-105 filter brightness-[0.12] select-none"
          />
        </motion.div>

        {/* Ambient Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:6rem_6rem] z-10 pointer-events-none" />

        {/* Dynamic Glowing Ambient Light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-gold/5 blur-[120px] rounded-full pointer-events-none z-10" />

        {/* Content Container (Two columns on desktop) */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center pt-8 sm:pt-16 lg:pt-0">
          
          {/* Left Column: Brand Statement & Shop CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left gap-6">
            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-[9px] uppercase tracking-[0.25em] text-brand-silver"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
              <span>Boutique Digital & Concierge de Importados</span>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="flex flex-col gap-1 mt-2"
            >
              <span className="text-brand-white font-sans font-light text-xs sm:text-sm tracking-[0.4em] uppercase text-brand-silver/80">
                VISÃO IMPORTADOS
              </span>
              <h1 className="font-sans text-4xl sm:text-5xl lg:text-6xl tracking-tight text-white uppercase leading-[1.1] font-light">
                A sua boutique de <br />
                <span className="font-title text-5xl sm:text-6xl lg:text-7xl text-gold-gradient tracking-wide block mt-2">
                  IMPORTADOS
                </span>
              </h1>
            </motion.div>

            {/* Brief Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="font-sans text-brand-silver/70 text-xs sm:text-sm tracking-wider max-w-xl leading-relaxed mt-2"
            >
              Explore nossa curadoria seleta de perfumes de alta costura, eletrônicos de última geração e gadgets exclusivos. Adquira peças autênticas direto do nosso estoque ou solicite importações sob demanda com assessoria personalizada.
            </motion.p>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.45 }}
              className="flex flex-col sm:flex-row gap-4 items-center mt-6 w-full max-w-md"
            >
              <Link
                href="/catalogo"
                className="relative overflow-hidden group px-8 py-3.5 bg-gold-gradient text-black font-sans font-bold text-xs uppercase tracking-[0.15em] rounded hover:opacity-95 transition-all duration-300 w-full sm:w-1/2 text-center shadow-lg hover:shadow-brand-gold/20"
              >
                <div className="absolute inset-0 w-1/2 h-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-shimmer pointer-events-none" />
                Explorar Catálogo
              </Link>
              <Link
                href="#cotacao"
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById('cotacao')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="px-8 py-3.5 bg-transparent text-white border border-white/10 hover:border-brand-gold hover:text-brand-gold font-sans font-bold text-xs uppercase tracking-[0.15em] rounded transition-all duration-300 w-full sm:w-1/2 text-center backdrop-blur-sm hover:bg-brand-gold/5"
              >
                Solicitar Cotação
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex items-center gap-6 mt-8 pt-8 border-t border-white/5 w-full overflow-x-auto no-scrollbar whitespace-nowrap"
            >
              <div className="flex items-center gap-2 shrink-0">
                <Sparkles className="w-4 h-4 text-brand-gold" />
                <span className="text-[10px] font-sans uppercase tracking-widest text-brand-silver">100% Original</span>
              </div>
              <div className="w-px h-4 bg-white/10 shrink-0" />
              <div className="flex items-center gap-2 shrink-0">
                <ShieldCheck className="w-4 h-4 text-brand-gold" />
                <span className="text-[10px] font-sans uppercase tracking-widest text-brand-silver">Envio Segurado</span>
              </div>
              <div className="w-px h-4 bg-white/10 shrink-0" />
              <div className="flex items-center gap-2 shrink-0">
                <UserCheck className="w-4 h-4 text-brand-gold" />
                <span className="text-[10px] font-sans uppercase tracking-widest text-brand-silver">Atendimento Vip</span>
              </div>
            </motion.div>
          </div>

          {/* Right Column: E-commerce Product Showcase Card */}
          <div className="lg:col-span-5 w-full flex justify-center lg:justify-end">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative w-full max-w-[360px] sm:max-w-[380px] aspect-[4/5] mx-auto lg:mx-0"
            >
              {/* Soft ambient lighting glow behind the card */}
              <div className="absolute inset-0 bg-brand-gold/10 blur-[80px] rounded-full pointer-events-none -z-10" />
              
              {/* Product Card Box */}
              <div className="relative w-full h-full bg-neutral-950/40 border border-white/5 rounded-2xl p-6 backdrop-blur-md flex flex-col justify-between shadow-2xl overflow-hidden group/card gold-glow">
                {/* Internal subtle grid overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
                
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeHeroIndex}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.4 }}
                    className="h-full flex flex-col justify-between"
                  >
                    {/* Card Top Details */}
                    <div className="flex items-center justify-between w-full z-10">
                      <span className="text-[9px] font-sans font-bold uppercase tracking-widest px-2.5 py-1 bg-white/5 border border-white/10 text-brand-gold rounded">
                        {heroProducts[activeHeroIndex].category_name}
                      </span>
                      {renderStatusBadge(heroProducts[activeHeroIndex].status)}
                    </div>

                    {/* Dynamic Image Canvas */}
                    <Link 
                      href={`/produto/${heroProducts[activeHeroIndex].slug}`}
                      className="relative w-full flex-grow my-4 flex items-center justify-center overflow-hidden rounded-lg cursor-pointer"
                    >
                      <div className="relative w-[80%] h-[80%] aspect-square transition-transform duration-700 group-hover/card:scale-105">
                        <Image
                          src={heroProducts[activeHeroIndex].image_url}
                          alt={heroProducts[activeHeroIndex].name}
                          fill
                          className="object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.85)]"
                          priority
                        />
                      </div>
                    </Link>

                    {/* Card Bottom Details */}
                    <div className="z-10 pt-4 border-t border-white/5">
                      <Link href={`/produto/${heroProducts[activeHeroIndex].slug}`}>
                        <h3 className="font-title text-sm text-white tracking-wide uppercase line-clamp-1 mb-1 hover:text-brand-gold transition-colors duration-300 cursor-pointer">
                          {heroProducts[activeHeroIndex].name}
                        </h3>
                      </Link>
                      <p className="font-sans text-[10px] text-brand-silver/60 line-clamp-1 mb-4">
                        {heroProducts[activeHeroIndex].description}
                      </p>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-sans text-brand-silver uppercase tracking-widest">Valor do Item</span>
                          <span className="text-sm font-sans font-bold text-white">
                            {heroProducts[activeHeroIndex].sale_price ? formatPrice(heroProducts[activeHeroIndex].sale_price!) : formatPrice(heroProducts[activeHeroIndex].price)}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => {
                            addToCart({
                              id: heroProducts[activeHeroIndex].id,
                              name: heroProducts[activeHeroIndex].name,
                              slug: heroProducts[activeHeroIndex].slug,
                              price: heroProducts[activeHeroIndex].price,
                              sale_price: heroProducts[activeHeroIndex].sale_price,
                              image_url: heroProducts[activeHeroIndex].image_url,
                              status: heroProducts[activeHeroIndex].status
                            })
                          }}
                          className="px-4 py-2 bg-white/5 hover:bg-brand-gold border border-white/10 hover:border-brand-gold text-white hover:text-black font-sans font-bold text-[9px] uppercase tracking-widest rounded transition-all duration-300 flex items-center gap-1.5 shadow"
                        >
                          Comprar <ShoppingBag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Slider Dots */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {heroProducts.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveHeroIndex(index)}
                    className="group py-2 focus:outline-none"
                    aria-label={`Visualizar produto ${index + 1}`}
                  >
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeHeroIndex === index ? 'w-6 bg-brand-gold' : 'w-1.5 bg-white/20 hover:bg-white/40'
                    }`} />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

        </div>

        {/* Scroll Down Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-brand-silver/40 z-20 select-none">
          <span className="text-[7px] font-sans uppercase tracking-[0.3em]">Role para navegar</span>
          <div className="w-1.5 h-6 border border-white/10 rounded-full flex justify-center p-0.5">
            <motion.div 
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1 h-1 bg-brand-gold rounded-full"
            />
          </div>
        </div>
      </section>


      {/* DIFERENCIAIS SECTION */}
      <section className="bg-black py-24 border-y border-white/5 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-brand-gold text-[10px] font-sans font-bold tracking-widest uppercase">Por que nos escolher?</span>
            <h2 className="font-title text-2xl sm:text-4xl text-white uppercase mt-2 tracking-wide">DIFERENCIAIS EXCLUSIVOS</h2>
            <div className="w-12 h-0.5 bg-brand-gold mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-8 bg-brand-black border border-white/5 hover:border-brand-gold/30 rounded-lg group transition-all duration-500 hover:-translate-y-1">
              <div className="w-12 h-12 bg-white/5 group-hover:bg-brand-gold/10 border border-white/10 group-hover:border-brand-gold/30 rounded flex items-center justify-center mb-6 transition-all duration-300">
                <Sparkles className="w-6 h-6 text-brand-gold" />
              </div>
              <h3 className="font-title text-base text-white mb-3">Produtos Originais</h3>
              <p className="font-sans text-xs text-brand-silver leading-relaxed">
                Importamos apenas produtos com 100% de autenticidade garantida direto de seus fabricantes e distribuidores oficiais no exterior.
              </p>
            </div>

            {/* Card 2 */}
            <div className="p-8 bg-brand-black border border-white/5 hover:border-brand-gold/30 rounded-lg group transition-all duration-500 hover:-translate-y-1">
              <div className="w-12 h-12 bg-white/5 group-hover:bg-brand-gold/10 border border-white/10 group-hover:border-brand-gold/30 rounded flex items-center justify-center mb-6 transition-all duration-300">
                <ShieldCheck className="w-6 h-6 text-brand-gold" />
              </div>
              <h3 className="font-title text-base text-white mb-3">Importação Segura</h3>
              <p className="font-sans text-xs text-brand-silver leading-relaxed">
                Logística consolidada com todos os trâmites aduaneiros simplificados. Garantimos a chegada segura e legal do seu produto.
              </p>
            </div>

            {/* Card 3 */}
            <div className="p-8 bg-brand-black border border-white/5 hover:border-brand-gold/30 rounded-lg group transition-all duration-500 hover:-translate-y-1">
              <div className="w-12 h-12 bg-white/5 group-hover:bg-brand-gold/10 border border-white/10 group-hover:border-brand-gold/30 rounded flex items-center justify-center mb-6 transition-all duration-300">
                <UserCheck className="w-6 h-6 text-brand-gold" />
              </div>
              <h3 className="font-title text-base text-white mb-3">Atendimento Personalizado</h3>
              <p className="font-sans text-xs text-brand-silver leading-relaxed">
                Nossos consultores prestam suporte integral de ponta a ponta, oferecendo atendimento executivo humanizado via WhatsApp.
              </p>
            </div>

            {/* Card 4 */}
            <div className="p-8 bg-brand-black border border-white/5 hover:border-brand-gold/30 rounded-lg group transition-all duration-500 hover:-translate-y-1">
              <div className="w-12 h-12 bg-white/5 group-hover:bg-brand-gold/10 border border-white/10 group-hover:border-brand-gold/30 rounded flex items-center justify-center mb-6 transition-all duration-300">
                <Truck className="w-6 h-6 text-brand-gold" />
              </div>
              <h3 className="font-title text-base text-white mb-3">Entrega Nacional</h3>
              <p className="font-sans text-xs text-brand-silver leading-relaxed">
                Despachamos para todo o território nacional através de transportadoras premium especializadas com seguro integral da carga.
              </p>
            </div>

            {/* Card 5 */}
            <div className="p-8 bg-brand-black border border-white/5 hover:border-brand-gold/30 rounded-lg group transition-all duration-500 hover:-translate-y-1">
              <div className="w-12 h-12 bg-white/5 group-hover:bg-brand-gold/10 border border-white/10 group-hover:border-brand-gold/30 rounded flex items-center justify-center mb-6 transition-all duration-300">
                <TrendingUp className="w-6 h-6 text-brand-gold" />
              </div>
              <h3 className="font-title text-base text-white mb-3">Produtos Exclusivos</h3>
              <p className="font-sans text-xs text-brand-silver leading-relaxed">
                Acesso antecipado a lançamentos globais que não estão disponíveis no mercado nacional tradicional.
              </p>
            </div>

            {/* Card 6 */}
            <div className="p-8 bg-brand-black border border-white/5 hover:border-brand-gold/30 rounded-lg group transition-all duration-500 hover:-translate-y-1">
              <div className="w-12 h-12 bg-white/5 group-hover:bg-brand-gold/10 border border-white/10 group-hover:border-brand-gold/30 rounded flex items-center justify-center mb-6 transition-all duration-300">
                <HelpCircle className="w-6 h-6 text-brand-gold" />
              </div>
              <h3 className="font-title text-base text-white mb-3">Garantia de Procedência</h3>
              <p className="font-sans text-xs text-brand-silver leading-relaxed">
                Rastreabilidade completa do produto desde o embarque no país de origem até a entrega em suas mãos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIAS SECTION */}
      <section className="bg-brand-black py-24 border-b border-white/5 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-brand-gold text-[10px] font-sans font-bold tracking-widest uppercase">Coleções</span>
            <h2 className="font-title text-2xl sm:text-4xl text-white uppercase mt-2 tracking-wide">CATEGORIAS PREMIUM</h2>
            <div className="w-12 h-0.5 bg-brand-gold mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {categories.slice(0, 9).map((cat) => {
              // Find matching visual image
              const mockCat = MOCK_CATEGORIES.find((mc) => mc.slug === cat.slug) || MOCK_CATEGORIES[8]
              return (
                <Link
                  key={cat.id}
                  href={`/catalogo?categoria=${cat.slug}`}
                  className="relative h-64 group overflow-hidden rounded border border-white/5 flex flex-col justify-end p-6 hover:border-brand-gold/50 transition-all duration-500"
                >
                  <Image
                    src={mockCat.img}
                    alt={cat.name}
                    fill
                    className="object-cover absolute inset-0 z-0 group-hover:scale-110 transition-transform duration-700 brightness-[0.45] group-hover:brightness-[0.3]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                  
                  <div className="relative z-20 flex justify-between items-center w-full">
                    <div>
                      <span className="text-brand-gold text-[9px] uppercase tracking-widest">Catálogo</span>
                      <h3 className="font-title text-lg text-white group-hover:text-brand-gold transition-colors duration-300 uppercase">{cat.name}</h3>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white group-hover:border-brand-gold group-hover:text-brand-gold transition-colors duration-300">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* PRODUTOS EM DESTAQUE SECTION */}
      <section className="bg-black py-24 border-b border-white/5 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-16 gap-4">
            <div>
              <span className="text-brand-gold text-[10px] font-sans font-bold tracking-widest uppercase">Seleção Exclusiva</span>
              <h2 className="font-title text-2xl sm:text-4xl text-white uppercase mt-2 tracking-wide">PRODUTOS EM DESTAQUE</h2>
              <div className="w-12 h-0.5 bg-brand-gold mt-4" />
            </div>
            <Link
              href="/catalogo"
              className="flex items-center gap-2 text-xs font-sans text-brand-gold tracking-widest uppercase hover:underline"
            >
              Ver Catálogo Completo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-gold mx-auto" />
              <p className="text-xs font-sans text-brand-silver mt-4">Carregando curadoria...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {featuredProducts.map((product) => (
                <div 
                  key={product.id}
                  className="bg-brand-black border border-white/5 hover:border-white/10 rounded overflow-hidden flex flex-col group transition-all duration-300"
                >
                  <Link href={`/produto/${product.slug}`} className="relative h-80 overflow-hidden block">
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

                  <div className="p-6 flex flex-col flex-grow">
                    <span className="text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-1.5">{product.category_name}</span>
                    <Link href={`/produto/${product.slug}`}>
                      <h3 className="font-title text-sm text-white mb-2 uppercase tracking-wide group-hover:text-brand-gold transition-colors duration-300 min-h-10">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="font-sans text-xs text-brand-silver/70 line-clamp-2 mb-6">
                      {product.description}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex flex-col">
                        {product.sale_price ? (
                          <>
                            <span className="text-[10px] font-sans text-brand-silver line-through">{formatPrice(product.price)}</span>
                            <span className="text-sm font-sans font-bold text-brand-gold-light">{formatPrice(product.sale_price)}</span>
                          </>
                        ) : (
                          <span className="text-sm font-sans font-bold text-white">
                            {product.status === 'on_request' ? 'Cotação sob Consulta' : formatPrice(product.price)}
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
                        className="p-2.5 bg-white/5 border border-white/10 hover:border-brand-gold hover:bg-brand-gold hover:text-black rounded text-white transition-all duration-300"
                        title="Adicionar ao Carrinho"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* IMPORTAÇÃO SOB DEMANDA SECTION */}
      <section id="cotacao" className="bg-brand-black py-24 border-b border-white/5 relative z-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-brand-gold text-[10px] font-sans font-bold tracking-widest uppercase">Serviço de Concierge</span>
            <h2 className="font-title text-2xl sm:text-4xl text-white uppercase mt-2 tracking-wide">NÃO ENCONTROU O QUE PROCURA?</h2>
            <p className="font-sans text-xs text-brand-silver mt-2 max-w-xl mx-auto leading-relaxed">
              Temos conexões internacionais para localizar produtos sob demanda. Solicite uma cotação personalizada e cuidamos de todo o processo de importação.
            </p>
            <div className="w-12 h-0.5 bg-brand-gold mx-auto mt-4" />
          </div>

          <form onSubmit={handleCotacaoSubmit} className="space-y-6 p-8 bg-black border border-white/5 rounded-lg gold-glow">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-2">Produto Desejado *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Rolex Submariner Date, Drone DJI Inspire 3"
                  value={cotacaoProduto}
                  onChange={(e) => setCotacaoProduto(e.target.value)}
                  className="w-full bg-brand-black border border-white/10 rounded px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-2">Link de Referência (Opcional)</label>
                <input
                  type="url"
                  placeholder="Ex: https://rolex.com/..."
                  value={cotacaoLink}
                  onChange={(e) => setCotacaoLink(e.target.value)}
                  className="w-full bg-brand-black border border-white/10 rounded px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-2">Observações Adicionais</label>
              <textarea
                rows={4}
                placeholder="Especifique cor, tamanho, voltagem ou quaisquer especificações adicionais que facilitem a cotação..."
                value={cotacaoObs}
                onChange={(e) => setCotacaoObs(e.target.value)}
                className="w-full bg-brand-black border border-white/10 rounded px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-4 bg-gold-gradient text-black font-sans font-bold text-xs uppercase tracking-widest rounded hover:opacity-90 transition-all duration-300"
            >
              <Send className="w-4 h-4" />
              Solicitar Cotação
            </button>
          </form>
        </div>
      </section>

      {/* SOBRE A EMPRESA */}
      <section id="sobre" className="bg-black py-24 border-b border-white/5 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative h-[500px] rounded-lg overflow-hidden border border-white/5">
              <Image
                src="/assets/about_us.png"
                alt="Galeria de Luxo"
                fill
                className="object-cover filter brightness-[0.7] scale-105"
              />
            </div>

            <div className="flex flex-col gap-6">
              <div>
                <span className="text-brand-gold text-[10px] font-sans font-bold tracking-widest uppercase">Nossa Essência</span>
                <h2 className="font-title text-2xl sm:text-4xl text-white uppercase mt-2 tracking-wide">VISÃO IMPORTADOS</h2>
                <div className="w-12 h-0.5 bg-brand-gold mt-4" />
              </div>

              <p className="font-sans text-xs text-brand-silver leading-relaxed">
                Nascemos do desejo de conectar nossos clientes aos bens de consumo mais refinados e extraordinários do mundo. Acreditamos que a importação de produtos de luxo e tecnologia de ponta não deve ser um processo burocrático e distante, mas uma experiência de compra personalizada, transparente e de extrema confiança.
              </p>
              
              <p className="font-sans text-xs text-brand-silver leading-relaxed">
                Através de parcerias estratégicas em Miami, Dubai e Genebra, oferecemos um serviço impecável de curadoria, transporte de segurança e desembaraço de produtos de altíssimo padrão, assegurando que o extraordinário chegue impecavelmente até você.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/5">
                <div>
                  <h4 className="font-title text-xs text-white uppercase tracking-wider mb-2">Missão</h4>
                  <p className="font-sans text-[11px] text-brand-silver/70 leading-relaxed">
                    Importar o extraordinário, proporcionando acesso a produtos mundiais premium com absoluta segurança e comodidade.
                  </p>
                </div>
                <div>
                  <h4 className="font-title text-xs text-white uppercase tracking-wider mb-2">Visão</h4>
                  <p className="font-sans text-[11px] text-brand-silver/70 leading-relaxed">
                    Ser a referência número um em intermediação de importados de luxo e novidades tecnológicas no Brasil.
                  </p>
                </div>
                <div>
                  <h4 className="font-title text-xs text-white uppercase tracking-wider mb-2">Valores</h4>
                  <p className="font-sans text-[11px] text-brand-silver/70 leading-relaxed">
                    Excelência nas operações, foco intransigente na procedência, exclusividade e relacionamento de confiança mútua.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTATO SECTION */}
      <section id="contato" className="bg-brand-black py-24 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-brand-gold text-[10px] font-sans font-bold tracking-widest uppercase">Fale Conosco</span>
            <h2 className="font-title text-2xl sm:text-4xl text-white uppercase mt-2 tracking-wide">CANAL DE ATENDIMENTO</h2>
            <div className="w-12 h-0.5 bg-brand-gold mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Form */}
            <form onSubmit={handleContatoSubmit} className="space-y-6 p-8 bg-black border border-white/5 rounded-lg">
              <h3 className="font-title text-sm text-white uppercase tracking-wider">Envie uma Mensagem</h3>
              <div>
                <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-2">Seu Nome *</label>
                <input
                  type="text"
                  required
                  placeholder="Insira seu nome completo"
                  value={contatoNome}
                  onChange={(e) => setContatoNome(e.target.value)}
                  className="w-full bg-brand-black border border-white/10 rounded px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-2">Seu E-mail (Opcional)</label>
                <input
                  type="email"
                  placeholder="Insira seu melhor e-mail"
                  value={contatoEmail}
                  onChange={(e) => setContatoEmail(e.target.value)}
                  className="w-full bg-brand-black border border-white/10 rounded px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-2">Mensagem *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Escreva sua dúvida ou solicitação..."
                  value={contatoMensagem}
                  onChange={(e) => setContatoMensagem(e.target.value)}
                  className="w-full bg-brand-black border border-white/10 rounded px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-4 bg-transparent border border-brand-gold text-brand-gold font-sans font-bold text-xs uppercase tracking-widest rounded hover:bg-brand-gold hover:text-black transition-all duration-300"
              >
                <MessageSquare className="w-4 h-4" />
                Falar pelo WhatsApp
              </button>
            </form>

            {/* info details */}
            <div className="flex flex-col justify-between p-8 bg-black border border-white/5 rounded-lg">
              <div className="space-y-8">
                <h3 className="font-title text-sm text-white uppercase tracking-wider">Atendimento Executivo</h3>
                
                <p className="font-sans text-xs text-brand-silver leading-relaxed">
                  Nosso canal direto está preparado para esclarecer dúvidas e formular orçamentos especiais com agilidade de Segunda a Sexta, das 9h às 18h.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5 text-brand-gold" />
                    </div>
                    <div>
                      <h4 className="font-title text-[10px] uppercase text-brand-gold tracking-widest">WhatsApp Oficial</h4>
                      <p className="font-sans text-xs text-white mt-1">(11) 99999-9999</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <Instagram className="w-5 h-5 text-brand-gold" />
                    </div>
                    <div>
                      <h4 className="font-title text-[10px] uppercase text-brand-gold tracking-widest">Instagram</h4>
                      <p className="font-sans text-xs text-white mt-1">@visaoimportados</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-brand-gold" />
                    </div>
                    <div>
                      <h4 className="font-title text-[10px] uppercase text-brand-gold tracking-widest">E-mail</h4>
                      <p className="font-sans text-xs text-white mt-1">contato@visaoimportados.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-brand-gold" />
                    </div>
                    <div>
                      <h4 className="font-title text-[10px] uppercase text-brand-gold tracking-widest">Localização</h4>
                      <p className="font-sans text-xs text-white mt-1">Escritório Central de Importações, São Paulo - SP</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 mt-8 flex justify-center gap-4">
                <span className="text-[9px] font-sans uppercase tracking-widest text-brand-gold font-bold">Confiança</span>
                <span className="text-brand-silver/30">•</span>
                <span className="text-[9px] font-sans uppercase tracking-widest text-brand-gold font-bold">Exclusividade</span>
                <span className="text-brand-silver/30">•</span>
                <span className="text-[9px] font-sans uppercase tracking-widest text-brand-gold font-bold">Garantia</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
