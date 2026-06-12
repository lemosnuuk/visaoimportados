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
      return null
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
