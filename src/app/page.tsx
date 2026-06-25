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

// Category visual covers mapping
const CATEGORY_IMAGES: Record<string, string> = {
  perfumes: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop&q=80',
  eletronicos: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
  scooters: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=600&auto=format&fit=crop&q=80',
  informatica: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
  games: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&auto=format&fit=crop&q=80',
  'smart-home': 'https://images.unsplash.com/photo-1558002038-1055907df827?w=600&auto=format&fit=crop&q=80',
  gadgets: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=600&auto=format&fit=crop&q=80',
  acessorios: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
  novidades: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&auto=format&fit=crop&q=80'
}

const DEFAULT_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&auto=format&fit=crop&q=80'

// Framer Motion staggered animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.15
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as any
    }
  }
}
const heroColumns = [
  {
    title: 'Perfumes Importados',
    subtitle: 'FRAGRÂNCIAS EXCLUSIVAS',
    description: 'Explore uma curadoria seleta de perfumes importados de grifes renomadas internacionalmente. Pronta entrega ou sob encomenda.',
    bgImage: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200&auto=format&fit=crop&q=80',
    buttonText: 'Explorar Perfumes',
    link: '/catalogo?categoria=perfumes'
  },
  {
    title: 'Eletrônicos Premium',
    subtitle: 'TECNOLOGIA DE PONTA',
    description: 'Os últimos lançamentos de smartphones, smartwatches e acessórios importados legítimos com garantia de procedência.',
    bgImage: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=1200&auto=format&fit=crop&q=80',
    buttonText: 'Ver Dispositivos',
    link: '/catalogo?categoria=eletronicos'
  },
  {
    title: 'Concierge Importados',
    subtitle: 'SERVIÇO EXECUTIVE & LUXURY',
    description: 'Deseja encomendar um relógio exclusivo, joias ou eletrônicos raros? Cuidamos de todo o processo de importação para você.',
    bgImage: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=1200&auto=format&fit=crop&q=80',
    buttonText: 'Solicitar Cotação',
    link: '#cotacao'
  }
]

// Minimalist Curation Info
export default function Home() {
  const { addToCart } = useCart()
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Hero columns hovered index state
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Responsive state for vertical stack heights
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
              image_url: imgUrl
            }
          })
          setFeaturedProducts(formattedProducts)
        } else {
          setFeaturedProducts([])
        }
      } catch (err) {
        console.error('Error fetching data from Supabase, using mock data.', err)
        setCategories([])
        setFeaturedProducts([])
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

      {/* HERO SECTION - SPLIT-SCREEN HOVER GRID */}
      <section id="home" className="relative min-h-screen lg:h-screen w-full bg-black overflow-hidden flex flex-col lg:flex-row z-30">
        
        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:6rem_6rem] z-10 pointer-events-none" />

        {heroColumns.map((col, index) => {
          const isHovered = hoveredIndex === index;
          const isAnyHovered = hoveredIndex !== null;

          return (
            <motion.div
              key={index}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => setHoveredIndex(hoveredIndex === index ? null : index)}
              className="relative flex-grow flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-white/5 last:border-0 cursor-pointer group"
              animate={{
                flexGrow: isHovered ? 2.2 : isAnyHovered ? 0.75 : 1,
                height: isMobile
                  ? (isHovered ? '45vh' : isAnyHovered ? '27.5vh' : '33.33vh')
                  : '100%'
              }}
              transition={{
                duration: 0.6,
                ease: [0.16, 1, 0.3, 1] as any
              }}
            >
              {/* Image Background */}
              <motion.div
                className="absolute inset-0 z-0"
                animate={{
                  scale: isHovered ? 1.05 : 1,
                  filter: isHovered 
                    ? 'brightness(0.45) contrast(1.05)' 
                    : isAnyHovered 
                      ? 'brightness(0.15) blur(2px)' 
                      : 'brightness(0.25)'
                }}
                transition={{ duration: 0.6 }}
              >
                <Image
                  src={col.bgImage}
                  alt={col.title}
                  fill
                  priority
                  className="object-cover pointer-events-none select-none"
                />
              </motion.div>

              {/* Dark Gradient bottom overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10 pointer-events-none" />

              {/* Glowing Ambient light behind text when hovered */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.15 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-brand-gold blur-[120px] pointer-events-none z-10"
                  />
                )}
              </AnimatePresence>

              {/* Column Content */}
              <div className="relative z-20 w-full max-w-md mx-auto px-8 flex flex-col items-center text-center gap-3">
                
                {/* Subtitle / Tagline */}
                <span className="text-brand-gold text-[9px] font-sans font-bold tracking-[0.25em] uppercase">
                  {col.subtitle}
                </span>

                {/* Title */}
                <h2 className="font-title text-2xl sm:text-3xl lg:text-4xl text-white uppercase tracking-wider transition-colors duration-300 group-hover:text-brand-gold">
                  {col.title}
                </h2>

                {/* Separator line */}
                <motion.div 
                  className="h-0.5 bg-brand-gold"
                  animate={{ width: isHovered ? '80px' : '40px' }}
                  transition={{ duration: 0.4 }}
                />

                {/* Description and CTA button (fade-in and slide up on hover) */}
                <div className="overflow-hidden w-full flex flex-col items-center">
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: 20 }}
                    animate={{
                      opacity: isHovered ? 1 : 0,
                      height: isHovered ? 'auto' : 0,
                      y: isHovered ? 0 : 20
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="flex flex-col items-center gap-6"
                  >
                    <p className="font-sans text-xs text-brand-silver/90 leading-relaxed max-w-xs mt-2">
                      {col.description}
                    </p>

                    <Link
                      href={col.link}
                      onClick={(e) => {
                        if (col.link.startsWith('#')) {
                          e.preventDefault();
                          const target = document.getElementById(col.link.substring(1));
                          if (target) {
                            target.scrollIntoView({ behavior: 'smooth' });
                          }
                        }
                      }}
                      className="relative overflow-hidden group/btn px-6 py-3 bg-gold-gradient text-black font-sans font-extrabold text-[10px] uppercase tracking-[0.15em] rounded hover:opacity-95 transition-all duration-300 shadow-lg shadow-brand-gold/10 hover:shadow-brand-gold/25"
                    >
                      <div className="absolute inset-0 w-[30px] h-full bg-white/25 transform -skew-x-12 -translate-x-full animate-shimmer-continuous pointer-events-none" />
                      {col.buttonText}
                    </Link>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Scroll Down Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-brand-silver/30 z-30 select-none pointer-events-none">
          <span className="text-[7px] font-sans uppercase tracking-[0.3em]">Role para navegar</span>
          <div className="w-1.5 h-6 border border-white/5 rounded-full flex justify-center p-0.5">
            <motion.div 
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-1.5 h-1.5 bg-brand-gold/55 rounded-full"
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
              const imgUrl = CATEGORY_IMAGES[cat.slug] || DEFAULT_CATEGORY_IMAGE
              return (
                <Link
                  key={cat.id}
                  href={`/catalogo?categoria=${cat.slug}`}
                  className="relative h-64 group overflow-hidden rounded border border-white/5 flex flex-col justify-end p-6 hover:border-brand-gold/50 transition-all duration-500"
                >
                  <Image
                    src={imgUrl}
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
