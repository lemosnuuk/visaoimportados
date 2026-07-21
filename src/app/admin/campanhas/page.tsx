'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { 
  Plus, 
  Sparkles, 
  Search, 
  Calendar, 
  Edit2, 
  Trash2, 
  Loader2, 
  Check, 
  X, 
  Tag, 
  Upload, 
  Power,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

interface Product {
  id: string
  name: string
  brand: string | null
  price: number | null
  sale_price: number | null
}

interface CampaignProduct {
  product_id: string
  discount_percentage: number | null
  campaign_price: number | null
}

interface Campaign {
  id: string
  name: string
  slug: string
  badge_label: string
  hero_subtitle: string | null
  hero_title: string | null
  banner_image_url: string | null
  start_date: string
  end_date: string
  is_active: boolean
  created_at: string
  products_count?: number
}

export default function AdminCampanhasPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Form Fields
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [badgeLabel, setBadgeLabel] = useState('')
  const [heroSubtitle, setHeroSubtitle] = useState('')
  const [heroTitle, setHeroTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isActive, setIsActive] = useState(true)

  // Image Upload
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

  // Product Selection & Discounts
  const [selectedProductMap, setSelectedProductMap] = useState<Record<string, { discount: string; price: string }>>({})
  const [productSearch, setProductSearch] = useState('')
  const [bulkDiscount, setBulkDiscount] = useState('')

  const supabase = createClient()

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      // 1. Fetch products
      const { data: dbProds } = await supabase
        .from('products')
        .select('id, name, brand, price, sale_price')
        .order('name')

      if (dbProds) {
        setProducts(dbProds.map(p => ({
          ...p,
          price: p.price !== null ? Number(p.price) : null,
          sale_price: p.sale_price !== null ? Number(p.sale_price) : null
        })))
      }

      // 2. Fetch campaigns with products count
      const { data: dbCamps } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_products(product_id)
        `)
        .order('created_at', { ascending: false })

      if (dbCamps) {
        const formatted = dbCamps.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          badge_label: c.badge_label,
          hero_subtitle: c.hero_subtitle,
          hero_title: c.hero_title,
          banner_image_url: c.banner_image_url,
          start_date: c.start_date,
          end_date: c.end_date,
          is_active: c.is_active,
          created_at: c.created_at,
          products_count: c.campaign_products?.length || 0
        }))
        setCampaigns(formatted)
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err)
    } finally {
      setLoading(false)
    }
  }

  // Slug generator helper
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleNameChange = (val: string) => {
    setName(val)
    if (!editingId) {
      setSlug(generateSlug(val))
    }
  }

  // Helper to format ISO or Date object for <input type="datetime-local"> in local timezone
  const toLocalDatetimeInput = (dateInput: Date | string) => {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    if (isNaN(d.getTime())) return ''
    const pad = (n: number) => (n < 10 ? '0' + n : n)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  // Open modal for NEW campaign
  const handleOpenNewModal = () => {
    setEditingId(null)
    setName('')
    setSlug('')
    setBadgeLabel('Especial Promoção')
    setHeroSubtitle('OFERTAS IMPERDÍVEIS')
    setHeroTitle('')
    
    // Default dates: start today, end in 7 days
    const now = new Date()
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    setStartDate(toLocalDatetimeInput(now))
    setEndDate(toLocalDatetimeInput(in7Days))
    
    setIsActive(true)
    setBannerFile(null)
    setBannerPreview(null)
    setSelectedProductMap({})
    setBulkDiscount('')
    setIsModalOpen(true)
  }

  // Open modal for EDITING existing campaign
  const handleOpenEditModal = async (camp: Campaign) => {
    setEditingId(camp.id)
    setName(camp.name)
    setSlug(camp.slug)
    setBadgeLabel(camp.badge_label)
    setHeroSubtitle(camp.hero_subtitle || '')
    setHeroTitle(camp.hero_title || '')
    setStartDate(toLocalDatetimeInput(camp.start_date))
    setEndDate(toLocalDatetimeInput(camp.end_date))
    setIsActive(camp.is_active)
    setBannerFile(null)
    setBannerPreview(camp.banner_image_url)
    setBulkDiscount('')

    // Fetch existing campaign products
    const { data: dbCampProds } = await supabase
      .from('campaign_products')
      .select('product_id, discount_percentage, campaign_price')
      .eq('campaign_id', camp.id)

    const map: Record<string, { discount: string; price: string }> = {}
    if (dbCampProds) {
      dbCampProds.forEach((cp: any) => {
        map[cp.product_id] = {
          discount: cp.discount_percentage ? String(cp.discount_percentage) : '',
          price: cp.campaign_price ? String(cp.campaign_price) : ''
        }
      })
    }
    setSelectedProductMap(map)
    setIsModalOpen(true)
  }

  // Image Upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setBannerFile(file)
      setBannerPreview(URL.createObjectURL(file))
    }
  }

  // Product Selection Handlers
  const toggleProductSelection = (prod: Product) => {
    setSelectedProductMap((prev) => {
      const copy = { ...prev }
      if (copy[prod.id]) {
        delete copy[prod.id]
      } else {
        copy[prod.id] = { discount: '', price: '' }
      }
      return copy
    })
  }

  const handleProductDiscountChange = (prodId: string, val: string) => {
    setSelectedProductMap((prev) => {
      const prod = products.find((p) => p.id === prodId)
      const basePrice = prod?.price || 0
      let calcPrice = ''
      if (val && basePrice > 0) {
        const perc = parseFloat(val.replace(',', '.'))
        if (!isNaN(perc)) {
          calcPrice = (basePrice * (1 - perc / 100)).toFixed(2)
        }
      }
      return {
        ...prev,
        [prodId]: { discount: val, price: calcPrice }
      }
    })
  }

  const handleProductPriceChange = (prodId: string, val: string) => {
    setSelectedProductMap((prev) => {
      return {
        ...prev,
        [prodId]: { ...(prev[prodId] || { discount: '' }), price: val }
      }
    })
  }

  const applyBulkDiscount = () => {
    const perc = parseFloat(bulkDiscount.replace(',', '.'))
    if (isNaN(perc) || perc <= 0) return

    setSelectedProductMap((prev) => {
      const next: Record<string, { discount: string; price: string }> = {}
      Object.keys(prev).forEach((prodId) => {
        const prod = products.find((p) => p.id === prodId)
        const basePrice = prod?.price || 0
        let calcPrice = ''
        if (basePrice > 0) {
          calcPrice = (basePrice * (1 - perc / 100)).toFixed(2)
        }
        next[prodId] = { discount: String(perc), price: calcPrice }
      })
      return next
    })
  }

  // Submit Handler
  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !startDate || !endDate) {
      alert('Por favor, preencha o nome da campanha e o período de vigência.')
      return
    }

    setSaving(true)
    try {
      let bannerUrl = bannerPreview

      // Upload banner file if provided
      if (bannerFile) {
        const fileExt = bannerFile.name.split('.').pop()
        const fileName = `campaign_banner_${Date.now()}.${fileExt}`
        const { error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(fileName, bannerFile)

        if (uploadErr) {
          alert('Erro ao fazer upload da imagem do banner.')
          setSaving(false)
          return
        }

        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)

        bannerUrl = publicUrlData.publicUrl
      }

      const campaignPayload = {
        name: name.trim(),
        slug: slug.trim() || generateSlug(name),
        badge_label: badgeLabel.trim() || name.trim(),
        hero_subtitle: heroSubtitle.trim() || null,
        hero_title: heroTitle.trim() || name.trim().toUpperCase(),
        banner_image_url: bannerUrl,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        is_active: isActive
      }

      let campaignId = editingId

      if (editingId) {
        // UPDATE existing
        const { error: updateErr } = await supabase
          .from('campaigns')
          .update(campaignPayload)
          .eq('id', editingId)

        if (updateErr) {
          alert('Erro ao atualizar a campanha.')
          setSaving(false)
          return
        }
      } else {
        // INSERT new
        const { data: newCamp, error: insertErr } = await supabase
          .from('campaigns')
          .insert([campaignPayload])
          .select()

        if (insertErr || !newCamp) {
          alert('Erro ao criar campanha. Verifique se o slug já não está em uso.')
          setSaving(false)
          return
        }
        campaignId = newCamp[0].id
      }

      // Save campaign products
      if (campaignId) {
        // Clear old relations first if editing
        await supabase.from('campaign_products').delete().eq('campaign_id', campaignId)

        const selectedIds = Object.keys(selectedProductMap)
        if (selectedIds.length > 0) {
          const campaignProductsRows = selectedIds.map((pId) => {
            const data = selectedProductMap[pId]
            const disc = data.discount ? parseFloat(data.discount.replace(',', '.')) : null
            const price = data.price ? parseFloat(data.price.replace(',', '.')) : null
            return {
              campaign_id: campaignId,
              product_id: pId,
              discount_percentage: !isNaN(disc as number) ? disc : null,
              campaign_price: !isNaN(price as number) ? price : null
            }
          })

          await supabase.from('campaign_products').insert(campaignProductsRows)
        }
      }

      setIsModalOpen(false)
      fetchInitialData()
    } catch (err) {
      console.error('Error saving campaign:', err)
    } finally {
      setSaving(false)
    }
  }

  // Toggle Active
  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ is_active: !current })
        .eq('id', id)

      if (error) {
        alert('Erro ao alterar status da campanha.')
        return
      }

      setCampaigns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: !current } : c))
      )
    } catch (err) {
      console.error(err)
    }
  }

  // Delete Campaign
  const handleDeleteCampaign = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir a campanha "${name}"?\nOs produtos voltarão ao valor padrão.`)) return

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id)

      if (error) {
        alert('Erro ao excluir campanha.')
        return
      }

      setCampaigns((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  // Status Badge Helper
  const getCampaignStatusBadge = (camp: Campaign) => {
    if (!camp.is_active) {
      return (
        <span className="px-3 py-1 text-xs font-sans font-bold uppercase text-red-400 bg-red-950/70 border border-red-500/30 rounded flex items-center gap-1.5 w-max">
          <Power className="w-3.5 h-3.5" /> Inativa
        </span>
      )
    }

    const now = new Date().getTime()
    const start = new Date(camp.start_date).getTime()
    const end = new Date(camp.end_date).getTime()

    if (now < start) {
      return (
        <span className="px-3 py-1 text-xs font-sans font-bold uppercase text-amber-400 bg-amber-950/70 border border-amber-500/30 rounded flex items-center gap-1.5 w-max">
          <Clock className="w-3.5 h-3.5" /> Agendada
        </span>
      )
    }

    if (now >= start && now <= end) {
      return (
        <span className="px-3 py-1 text-xs font-sans font-bold uppercase text-green-400 bg-green-950/70 border border-green-500/30 rounded flex items-center gap-1.5 w-max">
          <CheckCircle2 className="w-3.5 h-3.5 animate-pulse" /> Em Andamento
        </span>
      )
    }

    return (
      <span className="px-3 py-1 text-xs font-sans font-bold uppercase text-slate-400 bg-white/10 border border-white/15 rounded flex items-center gap-1.5 w-max">
        <AlertCircle className="w-3.5 h-3.5" /> Finalizada
      </span>
    )
  }

  // Filter products in modal
  const filteredModalProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.brand && p.brand.toLowerCase().includes(productSearch.toLowerCase()))
  )

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return 'Sob Consulta'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
  }

  return (
    <div className="space-y-10">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="font-title text-2xl sm:text-3xl text-white uppercase tracking-wide flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-brand-gold" />
            Campanhas Promocionais
          </h1>
          <p className="font-sans text-sm text-slate-300 mt-1">Crie promoções sazonais com agendamento de datas e destaque na Home</p>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="flex items-center gap-2 px-5 py-3.5 bg-brand-gold text-black font-sans text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 transition-all duration-300 shadow-md shadow-brand-gold/10"
        >
          <Plus className="w-4 h-4" />
          Nova Campanha
        </button>
      </div>

      {/* CAMPAIGN LIST */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-gold mx-auto" />
          <p className="text-sm font-sans text-slate-300 mt-3">Carregando campanhas...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-white/10 rounded-lg">
          <Sparkles className="w-10 h-10 text-brand-gold mx-auto mb-3 opacity-50" />
          <p className="text-base font-title text-white uppercase">Nenhuma campanha promocional cadastrada</p>
          <p className="text-sm font-sans text-slate-400 mt-1 max-w-md mx-auto">
            Crie campanhas para o Dia dos Pais, Natal, Black Friday e outros eventos com alteração automática de vitrine e catálogo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="bg-brand-black border border-white/10 rounded-lg overflow-hidden flex flex-col justify-between hover:border-brand-gold/40 transition-all duration-300 shadow-lg"
            >
              {/* Top Banner Preview */}
              <div className="relative h-40 w-full bg-black/60 border-b border-white/10 flex items-center justify-center overflow-hidden">
                {c.banner_image_url ? (
                  <Image
                    src={c.banner_image_url}
                    alt={c.name}
                    fill
                    className="object-cover opacity-60"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-gold/20 via-black to-zinc-900" />
                )}
                <div className="relative z-10 p-4 text-center">
                  {c.hero_subtitle && (
                    <span className="text-[10px] font-sans font-bold text-brand-gold uppercase tracking-widest block">
                      {c.hero_subtitle}
                    </span>
                  )}
                  <h3 className="font-title text-lg text-white font-bold uppercase tracking-wide mt-0.5">
                    {c.hero_title || c.name}
                  </h3>
                </div>
              </div>

              {/* Body Info */}
              <div className="p-6 space-y-4 flex-grow">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-white text-base">{c.name}</h4>
                    <span className="text-xs font-mono text-slate-400">/{c.slug}</span>
                  </div>
                  {getCampaignStatusBadge(c)}
                </div>

                <div className="space-y-2 text-xs font-sans text-slate-300 bg-white/5 p-3 rounded border border-white/5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Produtos em Oferta:</span>
                    <span className="font-bold text-white font-mono">{c.products_count} itens</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Início:</span>
                    <span className="font-medium text-white">{new Date(c.start_date).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Término:</span>
                    <span className="font-medium text-white">{new Date(c.end_date).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-black/40 border-t border-white/10 flex items-center justify-between">
                <button
                  onClick={() => handleToggleActive(c.id, c.is_active)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-bold uppercase rounded border transition-colors ${
                    c.is_active
                      ? 'text-green-400 border-green-500/30 bg-green-950/40 hover:border-green-400'
                      : 'text-slate-400 border-white/10 hover:border-white/30'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {c.is_active ? 'Ativa' : 'Desativada'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(c)}
                    className="p-2 text-white hover:text-brand-gold bg-white/5 border border-white/15 hover:border-brand-gold/40 rounded transition-colors"
                    title="Editar Campanha"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCampaign(c.id, c.name)}
                    className="p-2 text-slate-400 hover:text-red-400 bg-white/5 border border-white/15 hover:border-red-500/30 rounded transition-colors"
                    title="Excluir Campanha"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-brand-black border border-white/15 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl my-8">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black">
              <div>
                <h3 className="font-title text-xl text-white uppercase font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-brand-gold" />
                  {editingId ? 'Editar Campanha' : 'Nova Campanha Promocional'}
                </h3>
                <p className="text-xs font-sans text-slate-400 mt-0.5">Defina os detalhes visuais, vigência e produtos da promoção</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveCampaign} className="flex-grow overflow-y-auto p-6 space-y-8">
              {/* SECTION 1: CAMPAIGN INFO */}
              <div className="space-y-4">
                <h4 className="font-title text-sm text-brand-gold uppercase tracking-wider font-bold">1. Informações Básicas</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-sans font-bold text-slate-300 uppercase tracking-wider mb-2">Nome da Campanha *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Campanha Dia dos Pais 2026"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-bold text-slate-300 uppercase tracking-wider mb-2">Slug da URL *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: dia-dos-pais-2026"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-sans font-bold text-slate-300 uppercase tracking-wider mb-2">Selo do Produto *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Especial Dia dos Pais"
                      value={badgeLabel}
                      onChange={(e) => setBadgeLabel(e.target.value)}
                      className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-bold text-slate-300 uppercase tracking-wider mb-2">Subtítulo no Card da Home</label>
                    <input
                      type="text"
                      placeholder="Ex: OFERTAS IMPERDÍVEIS"
                      value={heroSubtitle}
                      onChange={(e) => setHeroSubtitle(e.target.value)}
                      className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-bold text-slate-300 uppercase tracking-wider mb-2">Título Principal na Home</label>
                    <input
                      type="text"
                      placeholder="Ex: ESPECIAL DIA DOS PAIS"
                      value={heroTitle}
                      onChange={(e) => setHeroTitle(e.target.value)}
                      className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: DATES & BANNER */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h4 className="font-title text-sm text-brand-gold uppercase tracking-wider font-bold">2. Período de Vigência & Banner</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-sans font-bold text-slate-300 uppercase tracking-wider mb-2">Data e Hora de Início *</label>
                    <input
                      type="datetime-local"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-bold text-slate-300 uppercase tracking-wider mb-2">Data e Hora de Término *</label>
                    <input
                      type="datetime-local"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-black border border-white/15 rounded px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                </div>

                {/* Banner Upload */}
                <div>
                  <label className="block text-xs font-sans font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Foto de Fundo para o Card da Home (Opcional)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative w-full sm:w-64 h-32 bg-black border border-white/15 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                      {bannerPreview ? (
                        <Image src={bannerPreview} alt="Preview" fill className="object-cover" />
                      ) : (
                        <div className="text-center text-slate-500 text-xs">
                          <Upload className="w-6 h-6 mx-auto mb-1 opacity-40" />
                          Nenhuma foto
                        </div>
                      )}
                    </div>

                    <label className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/15 hover:border-brand-gold text-white font-sans text-xs font-bold uppercase rounded cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-brand-gold" />
                      Escolher Foto do Computador
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>
                </div>
              </div>

              {/* SECTION 3: PRODUCTS & DISCOUNTS */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h4 className="font-title text-sm text-brand-gold uppercase tracking-wider font-bold">3. Seleção de Produtos e Preços Promocionais</h4>
                    <p className="text-xs font-sans text-slate-400">Selecione quais produtos fazem parte da promoção e defina o valor especial</p>
                  </div>

                  {/* Bulk discount bar */}
                  <div className="flex items-center gap-2 bg-black/60 p-2 rounded border border-white/10">
                    <input
                      type="text"
                      placeholder="% Desc em massa (ex: 15)"
                      value={bulkDiscount}
                      onChange={(e) => setBulkDiscount(e.target.value)}
                      className="w-44 bg-brand-black border border-white/15 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-brand-gold"
                    />
                    <button
                      type="button"
                      onClick={applyBulkDiscount}
                      className="px-3 py-1.5 bg-brand-gold text-black text-xs font-bold uppercase rounded hover:opacity-90"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>

                {/* Filter input */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar produto para incluir na promoção..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full bg-black border border-white/15 rounded pl-11 pr-4 py-2.5 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
                  />
                </div>

                {/* Products list table */}
                <div className="max-h-64 overflow-y-auto border border-white/10 rounded-lg bg-black/40">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 font-sans font-bold text-slate-300 uppercase">
                        <th className="p-3 w-10">Incluir</th>
                        <th className="p-3">Produto</th>
                        <th className="p-3">Preço Original</th>
                        <th className="p-3 w-32">% Desconto</th>
                        <th className="p-3 w-36">Preço Promocional</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-slate-200">
                      {filteredModalProducts.map((p) => {
                        const isSelected = !!selectedProductMap[p.id]
                        const data = selectedProductMap[p.id] || { discount: '', price: '' }
                        return (
                          <tr key={p.id} className={isSelected ? 'bg-brand-gold/10' : 'hover:bg-white/5'}>
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleProductSelection(p)}
                                className="w-4 h-4 accent-brand-gold cursor-pointer"
                              />
                            </td>
                            <td className="p-3 font-semibold text-white">
                              {p.name}
                              {p.brand && <span className="block text-[10px] text-brand-gold font-normal">{p.brand}</span>}
                            </td>
                            <td className="p-3 font-mono font-medium">{formatPrice(p.price)}</td>
                            <td className="p-3">
                              <input
                                type="text"
                                disabled={!isSelected}
                                placeholder="Ex: 10"
                                value={data.discount}
                                onChange={(e) => handleProductDiscountChange(p.id, e.target.value)}
                                className="w-full bg-brand-black border border-white/15 rounded px-2.5 py-1 text-xs text-white disabled:opacity-30 focus:outline-none focus:border-brand-gold font-mono"
                              />
                            </td>
                            <td className="p-3">
                              <input
                                type="text"
                                disabled={!isSelected}
                                placeholder="Ex: 199.90"
                                value={data.price}
                                onChange={(e) => handleProductPriceChange(p.id, e.target.value)}
                                className="w-full bg-brand-black border border-white/15 rounded px-2.5 py-1 text-xs text-white disabled:opacity-30 focus:outline-none focus:border-brand-gold font-mono font-bold text-brand-gold-light"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 border border-white/15 text-slate-300 font-sans text-xs font-bold uppercase rounded hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-gold text-black font-sans text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 disabled:opacity-50 shadow-md shadow-brand-gold/10"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Salvar Campanha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
