import React from 'react'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ProductClientPage from './product-client'

interface PageProps {
  params: Promise<{ slug: string }>
}

// Fallback Mock Products
const MOCK_PRODUCTS = [
  {
    id: 'p1',
    name: 'Bleu de Chanel Parfum 100ml',
    slug: 'bleu-de-chanel-parfum-100ml',
    description: 'Um perfume amadeirado aromático intenso e sofisticado para homens exigentes.',
    price: 949.00,
    sale_price: 899.00,
    status: 'in_stock' as const,
    featured: true,
    display_order: 1,
    category_name: 'Perfumes',
    category_slug: 'perfumes',
    image_url: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop&q=80']
  },
  {
    id: 'p2',
    name: 'iPhone 16 Pro Max 256GB Gold Titanium',
    slug: 'iphone-16-pro-max-256gb-gold',
    description: 'O iPhone definitivo com tela Super Retina XDR de 6.9 polegadas, câmera de 48MP e chip A18 Pro.',
    price: 9899.00,
    sale_price: null,
    status: 'pre_order' as const,
    featured: true,
    display_order: 2,
    category_name: 'Eletrônicos',
    category_slug: 'eletronicos',
    image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80']
  },
  {
    id: 'p3',
    name: 'Scooter Elétrica Kaabo Mantis King GT',
    slug: 'scooter-eletrica-kaabo-mantis-king-gt',
    description: 'Desempenho e luxo off-road com velocidade máxima de 70km/h e suspensão hidráulica ajustável.',
    price: 13900.00,
    sale_price: 12900.00,
    status: 'on_request' as const,
    featured: true,
    display_order: 3,
    category_name: 'Scooters',
    category_slug: 'scooters',
    image_url: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=600&auto=format&fit=crop&q=80']
  },
  {
    id: 'p4',
    name: 'MacBook Pro M4 Pro 16" Space Black',
    slug: 'macbook-pro-m4-pro-16-space-black',
    description: 'Superpoderoso para fluxos de trabalho avançados com chip M4 Pro, 24GB de RAM e 512GB SSD.',
    price: 24999.00,
    sale_price: null,
    status: 'pre_order' as const,
    featured: true,
    display_order: 4,
    category_name: 'Informática',
    category_slug: 'informatica',
    image_url: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80']
  },
  {
    id: 'p5',
    name: 'PlayStation 5 Pro 2TB',
    slug: 'playstation-5-pro-2tb',
    description: 'A experiência de jogo definitiva com ray tracing avançado, taxas de quadros super altas e 2TB de armazenamento.',
    price: 6999.00,
    sale_price: null,
    status: 'in_stock' as const,
    featured: true,
    display_order: 5,
    category_name: 'Games',
    category_slug: 'games',
    image_url: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&auto=format&fit=crop&q=80']
  },
  {
    id: 'p6',
    name: 'Apple Watch Ultra 2 Ocean Band',
    slug: 'apple-watch-ultra-2-ocean-band',
    description: 'O relógio de aventura definitivo com caixa de titânio de 49 mm, GPS de dupla frequência e bateria de até 36 horas.',
    price: 7499.00,
    sale_price: 6999.00,
    status: 'in_stock' as const,
    featured: true,
    display_order: 6,
    category_name: 'Gadgets',
    category_slug: 'gadgets',
    image_url: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=600&auto=format&fit=crop&q=80']
  },
  {
    id: 'p7',
    name: 'Creed Aventus Eau de Parfum 100ml',
    slug: 'creed-aventus-eau-de-parfum-100ml',
    description: 'Um perfume icônico frutado rico, celebrando força, poder e sucesso.',
    price: 2490.00,
    sale_price: null,
    status: 'in_stock' as const,
    display_order: 7,
    category_name: 'Perfumes',
    category_slug: 'perfumes',
    image_url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&auto=format&fit=crop&q=80'],
    featured: false
  },
  {
    id: 'p8',
    name: 'iPad Pro 13" M4 256GB Wi-Fi',
    slug: 'ipad-pro-13-m4-256gb',
    description: 'Incrivelmente fino, com o desempenho revolucionário do chip Apple M4 e tela Ultra Retina XDR.',
    price: 13200.00,
    sale_price: 12500.00,
    status: 'pre_order' as const,
    display_order: 8,
    category_name: 'Eletrônicos',
    category_slug: 'eletronicos',
    image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80',
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=80'],
    featured: false
  }
]

async function getProduct(slug: string) {
  try {
    const supabase = await createClient()
    
    // Fetch product details
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id, name, slug, description, price, sale_price, status, featured, display_order, category_id,
        categories(id, name, slug),
        product_images(image_url)
      `)
      .eq('slug', slug)
      .single()

    if (error || !product) {
      return MOCK_PRODUCTS.find((p) => p.slug === slug) || null
    }

    const images = product.product_images && product.product_images.length > 0
      ? product.product_images.map((img: any) => img.image_url)
      : ['https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&auto=format&fit=crop&q=80']

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      price: Number(product.price),
      sale_price: product.sale_price ? Number(product.sale_price) : null,
      status: product.status as any,
      featured: product.featured,
      display_order: product.display_order,
      category_id: product.category_id,
      category_name: Array.isArray(product.categories)
        ? (product.categories[0] as any)?.name || 'Importados'
        : (product.categories as any)?.name || 'Importados',
      category_slug: Array.isArray(product.categories)
        ? (product.categories[0] as any)?.slug || 'importados'
        : (product.categories as any)?.slug || 'importados',

      image_url: images[0],
      images
    }
  } catch (err) {
    console.error('Error fetching product from Supabase, using mock.', err)
    return MOCK_PRODUCTS.find((p) => p.slug === slug) || null
  }
}

// Generate dynamic metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    return {
      title: 'Produto não encontrado | Visão Importados',
      description: 'O produto solicitado não foi localizado em nossa curadoria.',
    }
  }

  return {
    title: `${product.name} | Visão Importados`,
    description: product.description || `Confira ${product.name} em nosso catálogo premium de importados.`,
    openGraph: {
      title: `${product.name} | Visão Importados`,
      description: product.description || `Confira ${product.name} em nosso catálogo premium de importados.`,
      images: [
        {
          url: product.image_url,
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
    },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params
  const product = await getProduct(slug)

  if (!product) {
    notFound()
  }

  // Schema.org JSON-LD Structured Data for Product SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images,
    description: product.description,
    offers: {
      '@type': 'Offer',
      price: product.sale_price || product.price,
      priceCurrency: 'BRL',
      availability: 
        product.status === 'in_stock' 
          ? 'https://schema.org/InStock' 
          : 'https://schema.org/PreOrder',
      url: `https://visaoimportados.com/produto/${product.slug}`
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductClientPage product={product} />
    </>
  )
}
