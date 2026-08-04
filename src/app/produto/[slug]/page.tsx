import React from 'react'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ProductClientPage from './product-client'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getProduct(slug: string) {
  try {
    const supabase = await createClient()
    
    // Fetch product details with images ordered by display_order
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        id, name, brand, slug, description, price, sale_price, status, featured, display_order, category_id,
        categories(id, name, slug),
        product_images(image_url, display_order)
      `)
      .eq('slug', slug)
      .eq('is_public', true)
      .single()

    if (error || !product) {
      return null
    }

    let sortedImages: string[] = []
    if (product.product_images && product.product_images.length > 0) {
      const sorted = [...product.product_images].sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
      sortedImages = sorted.map((img: any) => img.image_url)
    } else {
      sortedImages = ['https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=600&auto=format&fit=crop&q=80']
    }

    let effectiveSalePrice = product.sale_price !== null && product.sale_price !== undefined ? Number(product.sale_price) : null
    const nowIso = new Date().toISOString()

    // Check if product belongs to an active campaign currently running
    const { data: dbCamp } = await supabase
      .from('campaign_products')
      .select(`
        campaign_price,
        campaigns!inner(is_active, start_date, end_date, badge_label)
      `)
      .eq('product_id', product.id)
      .eq('campaigns.is_active', true)
      .lte('campaigns.start_date', nowIso)
      .gte('campaigns.end_date', nowIso)
      .maybeSingle()

    let isCampaign = false
    if (dbCamp && dbCamp.campaign_price) {
      effectiveSalePrice = Number(dbCamp.campaign_price)
      isCampaign = true
    }

    return {
      id: product.id,
      name: product.name,
      brand: product.brand || null,
      slug: product.slug,
      description: product.description || '',
      price: product.price !== null && product.price !== undefined ? Number(product.price) : null,
      sale_price: effectiveSalePrice,
      is_campaign: isCampaign,
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

      image_url: sortedImages[0],
      images: sortedImages
    }
  } catch (err) {
    console.error('Error fetching product from Supabase.', err)
    return null
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
      price: (product.sale_price || product.price) ?? 0,
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
