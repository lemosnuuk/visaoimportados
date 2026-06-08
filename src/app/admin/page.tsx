'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  Package, 
  Tag, 
  Sparkles, 
  Plus, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight 
} from 'lucide-react'

interface Stats {
  totalProducts: number
  totalCategories: number
  totalFeatured: number
}

interface RecentProduct {
  id: string
  name: string
  price: number
  status: string
  created_at: string
  category_name: string
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalCategories: 0,
    totalFeatured: 0
  })
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const supabase = createClient()

        // 1. Fetch total products count
        const { count: prodCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })

        // 2. Fetch total categories count
        const { count: catCount } = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true })

        // 3. Fetch featured count
        const { count: featuredCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('featured', true)

        // 4. Fetch 5 most recent products
        const { data: recent } = await supabase
          .from('products')
          .select(`
            id, name, price, status, created_at,
            categories(name)
          `)
          .order('created_at', { ascending: false })
          .limit(5)

        setStats({
          totalProducts: prodCount || 0,
          totalCategories: catCount || 0,
          totalFeatured: featuredCount || 0
        })

        if (recent) {
          const formatted = recent.map((p: any) => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            status: p.status,
            created_at: p.created_at,
            category_name: p.categories?.name || 'Importado'
          }))
          setRecentProducts(formatted)
        }
      } catch (err) {
        console.error('Error loading dashboard stats from Supabase', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <span className="text-[10px] uppercase font-bold text-green-400">Em Estoque</span>
      case 'pre_order':
        return <span className="text-[10px] uppercase font-bold text-amber-400">Sob Encomenda</span>
      case 'on_request':
        return <span className="text-[10px] uppercase font-bold text-blue-400">Sob Consulta</span>
      default:
        return <span className="text-[10px] uppercase font-bold text-brand-silver">{status}</span>
    }
  }

  return (
    <div className="space-y-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="font-title text-2xl sm:text-3xl text-white uppercase tracking-wide">Visão Geral</h1>
          <p className="font-sans text-xs text-brand-silver mt-1">Estatísticas e atividades recentes do catálogo</p>
        </div>

        <Link
          href="/admin/produtos/novo"
          className="flex items-center gap-1.5 px-5 py-3 bg-brand-gold text-black font-sans text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 transition-all duration-300"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Produto
        </Link>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-gold mx-auto" />
          <p className="text-xs font-sans text-brand-silver mt-3">Carregando painel...</p>
        </div>
      ) : (
        <>
          {/* STATS METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* CARD 1: PRODUCTS */}
            <div className="p-6 bg-brand-black border border-white/5 rounded-lg flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-sans text-brand-silver uppercase tracking-widest block">Total de Produtos</span>
                <span className="text-3xl font-sans font-bold text-white block">{stats.totalProducts}</span>
              </div>
              <div className="w-12 h-12 rounded bg-white/5 border border-white/10 flex items-center justify-center text-brand-gold">
                <Package className="w-6 h-6" />
              </div>
            </div>

            {/* CARD 2: CATEGORIES */}
            <div className="p-6 bg-brand-black border border-white/5 rounded-lg flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-sans text-brand-silver uppercase tracking-widest block">Categorias</span>
                <span className="text-3xl font-sans font-bold text-white block">{stats.totalCategories}</span>
              </div>
              <div className="w-12 h-12 rounded bg-white/5 border border-white/10 flex items-center justify-center text-brand-gold">
                <Tag className="w-6 h-6" />
              </div>
            </div>

            {/* CARD 3: FEATURED */}
            <div className="p-6 bg-brand-black border border-white/5 rounded-lg flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-sans text-brand-silver uppercase tracking-widest block">Produtos em Destaque</span>
                <span className="text-3xl font-sans font-bold text-white block">{stats.totalFeatured}</span>
              </div>
              <div className="w-12 h-12 rounded bg-white/5 border border-white/10 flex items-center justify-center text-brand-gold">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* RECENT ACTIVITY */}
          <div className="p-6 bg-brand-black border border-white/5 rounded-lg">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
              <h3 className="font-title text-sm text-white uppercase tracking-wider">Últimos Produtos Cadastrados</h3>
              <Link
                href="/admin/produtos"
                className="flex items-center gap-1 text-[11px] font-sans text-brand-gold tracking-widest uppercase hover:underline"
              >
                Gerenciar Todos
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentProducts.length === 0 ? (
              <p className="text-xs font-sans text-brand-silver py-6">Nenhum produto cadastrado no momento.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] font-sans text-brand-silver uppercase tracking-wider">
                      <th className="py-4">Nome</th>
                      <th className="py-4">Categoria</th>
                      <th className="py-4">Preço</th>
                      <th className="py-4">Status</th>
                      <th className="py-4">Data Cadastro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs font-sans text-brand-white">
                    {recentProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 font-medium text-white">{product.name}</td>
                        <td className="py-4 text-brand-silver">{product.category_name}</td>
                        <td className="py-4 font-bold">{formatPrice(product.price)}</td>
                        <td className="py-4">{getStatusLabel(product.status)}</td>
                        <td className="py-4 text-brand-silver flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-brand-gold" />
                          {new Date(product.created_at).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
