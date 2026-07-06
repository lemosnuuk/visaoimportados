'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Plus, 
  Search, 
  Trash2, 
  Loader2, 
  X, 
  TrendingUp, 
  Coins, 
  Calendar, 
  User, 
  ArrowRightLeft,
  ChevronDown,
  Info,
  DollarSign,
  BarChart3,
  Printer,
  CalendarRange,
  Download,
  Users,
  FileText
} from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
  stock_quantity?: number
  brand?: string | null
  categories?: { name: string } | { name: string }[] | null
}

interface Movement {
  id: string
  product_id: string
  type: 'entrada' | 'saida'
  quantity: number
  movement_date: string
  cost_price: number | null
  sale_price: number | null
  profit_percentage: number | null
  customer_name: string | null
  notes: string | null
  payment_type: 'vista' | 'parcelado' | null
  installments_total: number
  installments_paid: number
  payment_status: 'pago' | 'pendente' | 'parcialmente_pago' | null
  created_at: string
  products: {
    name: string
    price: number
  } | null
}

export default function AdminMovimentacoesPage() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)

  // Filter States
  const [searchProduct, setSearchProduct] = useState('')
  const [searchCustomer, setSearchCustomer] = useState('')
  const [selectedType, setSelectedType] = useState<'all' | 'entrada' | 'saida'>('all')
  const [sortBy, setSortBy] = useState('date_desc')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Reports Panel States
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false)
  const [reportType, setReportType] = useState<'estoque' | 'vendas' | 'lucro' | 'clientes' | 'produto_especifico'>('estoque')
  const [reportStartDate, setReportStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().substring(0, 10))
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().substring(0, 10))
  const [reportProductId, setReportProductId] = useState('')
  
  // New Movement Form States
  const [productId, setProductId] = useState('')
  const [type, setType] = useState<'entrada' | 'saida'>('entrada')
  const [quantity, setQuantity] = useState('1')
  const [movementDate, setMovementDate] = useState(new Date().toISOString().substring(0, 10))
  const [costPrice, setCostPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentType, setPaymentType] = useState<'vista' | 'parcelado'>('vista')
  const [installmentsTotal, setInstallmentsTotal] = useState('1')
  const [installmentsPaid, setInstallmentsPaid] = useState('0')

  // Helper State to display calculated profit
  const [calculatedProfit, setCalculatedProfit] = useState<number | null>(null)
  const [lastCostPriceMsg, setLastCostPriceMsg] = useState('')
  const [recentPurchases, setRecentPurchases] = useState<{ id: string, cost_price: number, quantity: number, movement_date: string }[]>([])

  const supabase = createClient()

  useEffect(() => {
    fetchInitialData()
  }, [])

  // Auto-fill cost price and suggest profit on product/sale_price changes
  useEffect(() => {
    if (type === 'saida' && productId) {
      loadRecentPurchases(productId)
    } else {
      setLastCostPriceMsg('')
      setRecentPurchases([])
    }
  }, [productId, type])

  // Recalculate profit percentage
  useEffect(() => {
    const sale = parseFloat(salePrice) || 0
    const cost = parseFloat(costPrice) || 0
    if (sale > 0 && cost > 0) {
      const profit = ((sale - cost) / cost) * 100
      setCalculatedProfit(Number(profit.toFixed(2)))
    } else {
      setCalculatedProfit(null)
    }
  }, [salePrice, costPrice])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      // 1. Fetch movements with product info
      const { data: dbMovements, error: mErr } = await supabase
        .from('product_movements')
        .select(`
          *,
          products (
            name,
            price
          )
        `)
        .order('movement_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (mErr) throw mErr
      if (dbMovements) setMovements(dbMovements as any)

      // 2. Fetch products for dropdown selection
      const { data: dbProducts, error: pErr } = await supabase
        .from('products')
        .select(`
          id, name, price, stock_quantity, brand,
          categories(name)
        `)
        .order('name')

      if (pErr) throw pErr
      if (dbProducts) {
        setProducts(dbProducts)
        if (dbProducts.length > 0) {
          setProductId(dbProducts[0].id)
          setReportProductId(dbProducts[0].id)
        }
      }
    } catch (err) {
      console.error('Error loading movements initial data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadRecentPurchases = async (prodId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_movements')
        .select('id, cost_price, quantity, movement_date')
        .eq('product_id', prodId)
        .eq('type', 'entrada')
        .order('movement_date', { ascending: false })
        .limit(5)

      if (error) throw error

      if (data) {
        const formatted = data
          .filter(d => d.cost_price !== null)
          .map((d: any) => ({
            id: d.id,
            cost_price: Number(d.cost_price),
            quantity: d.quantity,
            movement_date: d.movement_date
          }))
        setRecentPurchases(formatted)

        if (formatted.length > 0) {
          setCostPrice(String(formatted[0].cost_price))
          setLastCostPriceMsg(`Preço de custo sugerido (última compra): R$ ${formatted[0].cost_price.toFixed(2)}`)
        } else {
          // Fallback to base product price if no purchase is found
          const prod = products.find(p => p.id === prodId)
          if (prod) {
            setCostPrice(String(prod.price * 0.6)) // Suggest 60% of base price as placeholder cost
            setLastCostPriceMsg(`Sem histórico de compras. Preço base sugerido: R$ ${(prod.price * 0.6).toFixed(2)}`)
          } else {
            setCostPrice('')
            setLastCostPriceMsg('')
          }
        }
      }
    } catch (err) {
      console.error('Error fetching recent purchases:', err)
    }
  }

  const handleOpenModal = () => {
    // Reset Form
    if (products.length > 0) setProductId(products[0].id)
    setType('entrada')
    setQuantity('1')
    setMovementDate(new Date().toISOString().substring(0, 10))
    setCostPrice('')
    setSalePrice('')
    setCustomerName('')
    setNotes('')
    setPaymentType('vista')
    setInstallmentsTotal('1')
    setInstallmentsPaid('0')
    setCalculatedProfit(null)
    setLastCostPriceMsg('')
    setIsModalOpen(true)
  }

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productId || !quantity || (type === 'entrada' && !costPrice) || (type === 'saida' && !salePrice)) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    const qty = parseInt(quantity)

    // Bloquear saída de produtos caso não haja estoque suficiente
    if (type === 'saida') {
      const selectedProd = products.find(p => p.id === productId)
      const currentStock = selectedProd?.stock_quantity || 0
      if (qty > currentStock) {
        alert(`Erro: Estoque insuficiente. O produto "${selectedProd?.name}" possui apenas ${currentStock} unidades em estoque, mas você tentou registrar a saída de ${qty} unidades.`)
        return
      }
    }

    setSubmitLoading(true)

    try {
      const cost = parseFloat(costPrice) || 0
      const sale = parseFloat(salePrice) || 0
      const totalInst = parseInt(installmentsTotal) || 1
      const paidInst = parseInt(installmentsPaid) || 0

      // Infer payment status based on installments
      let finalPaymentStatus: 'pago' | 'pendente' | 'parcialmente_pago' = 'pago'
      if (type === 'saida') {
        if (paymentType === 'parcelado') {
          if (paidInst === 0) finalPaymentStatus = 'pendente'
          else if (paidInst >= totalInst) finalPaymentStatus = 'pago'
          else finalPaymentStatus = 'parcialmente_pago'
        } else {
          finalPaymentStatus = 'pago'
        }
      }

      const payload = {
        product_id: productId,
        type,
        quantity: qty,
        movement_date: new Date(movementDate).toISOString(),
        cost_price: cost > 0 ? cost : null,
        sale_price: type === 'saida' ? sale : null,
        profit_percentage: type === 'saida' && calculatedProfit !== null ? calculatedProfit : null,
        customer_name: type === 'saida' ? customerName : null,
        notes: notes || null,
        payment_type: type === 'saida' ? paymentType : null,
        installments_total: type === 'saida' && paymentType === 'parcelado' ? totalInst : 1,
        installments_paid: type === 'saida' && paymentType === 'parcelado' ? paidInst : (type === 'saida' ? 1 : 0),
        payment_status: type === 'saida' ? finalPaymentStatus : 'pago'
      }

      const { error } = await supabase
        .from('product_movements')
        .insert([payload])

      if (error) {
        alert('Erro ao registrar movimentação: ' + error.message)
      } else {
        setIsModalOpen(false)
        fetchInitialData()
      }
    } catch (err) {
      console.error(err)
      alert('Erro inesperado ao cadastrar movimentação.')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDeleteMovement = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta movimentação? O estoque será recalculado automaticamente.')) return

    try {
      const { error } = await supabase
        .from('product_movements')
        .delete()
        .eq('id', id)

      if (error) {
        alert('Erro ao deletar movimentação.')
        return
      }

      setMovements(prev => prev.filter(m => m.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  // Quick increment/decrement installments handler
  const handleStepInstallment = async (m: Movement, step: number) => {
    const nextPaid = m.installments_paid + step
    if (nextPaid < 0 || nextPaid > m.installments_total) return

    let finalPaymentStatus: 'pago' | 'pendente' | 'parcialmente_pago' = 'parcialmente_pago'
    if (nextPaid === 0) finalPaymentStatus = 'pendente'
    else if (nextPaid >= m.installments_total) finalPaymentStatus = 'pago'

    try {
      const { error } = await supabase
        .from('product_movements')
        .update({
          installments_paid: nextPaid,
          payment_status: finalPaymentStatus
        })
        .eq('id', m.id)

      if (error) throw error

      setMovements(prev => 
        prev.map(item => 
          item.id === m.id 
            ? { ...item, installments_paid: nextPaid, payment_status: finalPaymentStatus } 
            : item
        )
      )
    } catch (err) {
      console.error('Error updating installment step:', err)
      alert('Erro ao atualizar parcelas da movimentação.')
    }
  }

  // Local filtering and sorting
  const filteredAndSortedMovements = movements
    .filter((m) => {
      const prodName = m.products?.name.toLowerCase() || ''
      const custName = m.customer_name?.toLowerCase() || ''

      const matchesProduct = prodName.includes(searchProduct.toLowerCase())
      const matchesCustomer = custName.includes(searchCustomer.toLowerCase())
      const matchesType = selectedType === 'all' || m.type === selectedType

      return matchesProduct && matchesCustomer && matchesType
    })
    .sort((a, b) => {
      if (sortBy === 'product_asc') {
        const nameA = a.products?.name || ''
        const nameB = b.products?.name || ''
        return nameA.localeCompare(nameB)
      }
      if (sortBy === 'product_desc') {
        const nameA = a.products?.name || ''
        const nameB = b.products?.name || ''
        return nameB.localeCompare(nameA)
      }
      if (sortBy === 'customer_asc') {
        const nameA = a.customer_name || ''
        const nameB = b.customer_name || ''
        return nameA.localeCompare(nameB)
      }
      if (sortBy === 'customer_desc') {
        const nameA = a.customer_name || ''
        const nameB = b.customer_name || ''
        return nameB.localeCompare(nameA)
      }
      if (sortBy === 'date_asc') {
        return new Date(a.movement_date).getTime() - new Date(b.movement_date).getTime()
      }
      // default: date_desc
      return new Date(b.movement_date).getTime() - new Date(a.movement_date).getTime()
    })

  // active report helper calculations and rendering
  const renderActiveReport = () => {
    const startDateTime = new Date(reportStartDate + 'T00:00:00').getTime()
    const endDateTime = new Date(reportEndDate + 'T23:59:59').getTime()

    const reportMovements = movements.filter((m) => {
      const time = new Date(m.movement_date).getTime()
      return time >= startDateTime && time <= endDateTime
    })

    if (reportType === 'estoque') {
      const totalCatalog = products.length
      const totalStockItems = products.reduce((acc, p) => acc + (p.stock_quantity || 0), 0)
      const totalValuation = products.reduce((acc, p) => acc + ((p.stock_quantity || 0) * p.price), 0)

      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-lg flex flex-col justify-between print:border-neutral-200 print:text-black">
              <span className="text-[9px] font-sans text-brand-gold uppercase tracking-widest print:text-neutral-500">Total de Itens Cadastrados</span>
              <span className="text-2xl font-title text-white font-bold mt-2 print:text-black">{totalCatalog}</span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-lg flex flex-col justify-between print:border-neutral-200 print:text-black">
              <span className="text-[9px] font-sans text-brand-gold uppercase tracking-widest print:text-neutral-500">Unidades Físicas em Estoque</span>
              <span className="text-2xl font-title text-white font-bold mt-2 print:text-black">{totalStockItems} un</span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-lg flex flex-col justify-between print:border-neutral-200 print:text-black">
              <span className="text-[9px] font-sans text-brand-gold uppercase tracking-widest print:text-neutral-500">Valor Estimado do Inventário (Venda)</span>
              <span className="text-2xl font-title text-brand-gold-light font-bold mt-2 print:text-black">{formatPrice(totalValuation)}</span>
            </div>
          </div>

          <div className="bg-black/35 border border-white/5 rounded-lg overflow-hidden print:border-neutral-200">
            <table className="w-full text-left border-collapse text-xs print:text-black">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-sans text-brand-silver uppercase tracking-wider print:border-neutral-200 print:text-neutral-600">
                  <th className="p-4">Marca</th>
                  <th className="p-4">Produto</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4 text-center">Estoque</th>
                  <th className="p-4 text-right">Preço de Venda</th>
                  <th className="p-4 text-right">Total Estimado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-neutral-200">
                {products.map((p) => {
                  const stock = p.stock_quantity || 0
                  const category = p.categories 
                    ? (Array.isArray(p.categories) ? p.categories[0]?.name : p.categories.name) || 'Sem Categoria'
                    : 'Sem Categoria'
                  const total = stock * p.price
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.01] print:hover:bg-transparent">
                      <td className="p-4 font-mono font-bold text-brand-gold print:text-neutral-700">{p.brand || '-'}</td>
                      <td className="p-4 text-white font-medium print:text-black">{p.name}</td>
                      <td className="p-4 text-brand-silver print:text-neutral-500">{category}</td>
                      <td className="p-4 text-center font-mono font-bold text-white print:text-black">{stock} un</td>
                      <td className="p-4 text-right font-mono print:text-neutral-700">{formatPrice(p.price)}</td>
                      <td className="p-4 text-right font-mono text-brand-gold-light font-semibold print:text-black">{formatPrice(total)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    if (reportType === 'vendas') {
      const salesMovements = reportMovements.filter((m) => m.type === 'saida')
      const totalSales = salesMovements.length
      const totalItemsSold = salesMovements.reduce((acc, m) => acc + m.quantity, 0)
      const totalRevenue = salesMovements.reduce((acc, m) => acc + (m.quantity * (m.sale_price || 0)), 0)
      const totalVista = salesMovements.filter(m => m.payment_type === 'vista').reduce((acc, m) => acc + (m.quantity * (m.sale_price || 0)), 0)
      const totalParcelado = salesMovements.filter(m => m.payment_type === 'parcelado').reduce((acc, m) => acc + (m.quantity * (m.sale_price || 0)), 0)

      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-lg flex flex-col justify-between print:border-neutral-200 print:text-black">
              <span className="text-[9px] font-sans text-brand-gold uppercase tracking-widest print:text-neutral-500">Transações de Venda</span>
              <span className="text-2xl font-title text-white font-bold mt-2 print:text-black">{totalSales}</span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-lg flex flex-col justify-between print:border-neutral-200 print:text-black">
              <span className="text-[9px] font-sans text-brand-gold uppercase tracking-widest print:text-neutral-500">Unidades Vendidas</span>
              <span className="text-2xl font-title text-white font-bold mt-2 print:text-black">{totalItemsSold} un</span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-lg flex flex-col justify-between print:border-neutral-200 print:text-black">
              <span className="text-[9px] font-sans text-brand-gold uppercase tracking-widest print:text-neutral-500">Faturamento Bruto</span>
              <span className="text-2xl font-title text-brand-gold-light font-bold mt-2 print:text-black">{formatPrice(totalRevenue)}</span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-lg flex flex-col justify-between print:border-neutral-200 print:text-black">
              <span className="text-[9px] font-sans text-brand-gold uppercase tracking-widest print:text-neutral-500">À Vista / Parcelado</span>
              <span className="text-xs text-white font-bold mt-3 print:text-black block">
                V: {formatPrice(totalVista)} <br/>
                P: {formatPrice(totalParcelado)}
              </span>
            </div>
          </div>

          <div className="bg-black/35 border border-white/5 rounded-lg overflow-hidden print:border-neutral-200">
            <table className="w-full text-left border-collapse text-xs print:text-black">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-sans text-brand-silver uppercase tracking-wider print:border-neutral-200 print:text-neutral-600">
                  <th className="p-4">Data</th>
                  <th className="p-4">Produto</th>
                  <th className="p-4 text-center">Qtd.</th>
                  <th className="p-4 text-right">Preço Unit.</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Método</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-neutral-200">
                {salesMovements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-brand-silver print:text-black">Nenhuma venda registrada no período.</td>
                  </tr>
                ) : (
                  salesMovements.map((m) => {
                    const total = m.quantity * (m.sale_price || 0)
                    return (
                      <tr key={m.id} className="hover:bg-white/[0.01] print:hover:bg-transparent">
                        <td className="p-4 font-mono text-brand-silver print:text-neutral-600">{new Date(m.movement_date).toLocaleDateString('pt-BR')}</td>
                        <td className="p-4 text-white font-medium print:text-black">{m.products?.name || 'Produto Excluído'}</td>
                        <td className="p-4 text-center font-mono print:text-black">{m.quantity} un</td>
                        <td className="p-4 text-right font-mono print:text-neutral-600">{formatPrice(m.sale_price)}</td>
                        <td className="p-4 text-right font-mono text-white font-semibold print:text-black">{formatPrice(total)}</td>
                        <td className="p-4 text-brand-silver print:text-neutral-700">{m.customer_name || '-'}</td>
                        <td className="p-4 text-brand-silver uppercase print:text-neutral-700 text-[10px]">{m.payment_type === 'vista' ? 'À Vista' : 'Parcelado'}</td>
                        <td className="p-4 text-[10px] print:text-black">
                          <span className={`font-bold uppercase ${m.payment_status === 'pago' ? 'text-green-400' : m.payment_status === 'parcialmente_pago' ? 'text-amber-400' : 'text-red-400'}`}>
                            {m.payment_status}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    if (reportType === 'lucro') {
      const salesMovements = reportMovements.filter((m) => m.type === 'saida')
      const totalRevenue = salesMovements.reduce((acc, m) => acc + (m.quantity * (m.sale_price || 0)), 0)
      const totalCost = salesMovements.reduce((acc, m) => acc + (m.quantity * (m.cost_price || (m.products?.price ? m.products.price * 0.6 : 0))), 0)
      const netProfit = totalRevenue - totalCost
      const profitMargin = totalCost > 0 ? (netProfit / totalCost) * 100 : 0

      const productSummary: Record<string, { name: string, qty: number, totalCost: number, totalRevenue: number }> = {}
      salesMovements.forEach((m) => {
        const key = m.product_id
        const cost = m.cost_price || (m.products?.price ? m.products.price * 0.6 : 0)
        const sale = m.sale_price || 0
        if (!productSummary[key]) {
          productSummary[key] = {
            name: m.products?.name || 'Produto Excluído',
            qty: 0,
            totalCost: 0,
            totalRevenue: 0
          }
        }
        productSummary[key].qty += m.quantity
        productSummary[key].totalCost += m.quantity * cost
        productSummary[key].totalRevenue += m.quantity * sale
      })

      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-lg flex flex-col justify-between print:border-neutral-200 print:text-black">
              <span className="text-[9px] font-sans text-brand-gold uppercase tracking-widest print:text-neutral-500">Receita Bruta (Vendas)</span>
              <span className="text-2xl font-title text-white font-bold mt-2 print:text-black">{formatPrice(totalRevenue)}</span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-lg flex flex-col justify-between print:border-neutral-200 print:text-black">
              <span className="text-[9px] font-sans text-brand-gold uppercase tracking-widest print:text-neutral-500">CMV Acumulado</span>
              <span className="text-2xl font-title text-brand-silver font-bold mt-2 print:text-black">{formatPrice(totalCost)}</span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-lg flex flex-col justify-between print:border-neutral-200 print:text-black">
              <span className="text-[9px] font-sans text-brand-gold uppercase tracking-widest print:text-neutral-500">Lucro Líquido Real</span>
              <span className="text-2xl font-title text-green-400 font-bold mt-2 print:text-black">{formatPrice(netProfit)}</span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-lg flex flex-col justify-between print:border-neutral-200 print:text-black">
              <span className="text-[9px] font-sans text-brand-gold uppercase tracking-widest print:text-neutral-500">Margem Média Retorno</span>
              <span className={`text-2xl font-title font-bold mt-2 print:text-black ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="bg-black/35 border border-white/5 rounded-lg overflow-hidden print:border-neutral-200">
            <table className="w-full text-left border-collapse text-xs print:text-black">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-sans text-brand-silver uppercase tracking-wider print:border-neutral-200 print:text-neutral-600">
                  <th className="p-4">Produto</th>
                  <th className="p-4 text-center">Qtd. Vendida</th>
                  <th className="p-4 text-right">CMV Acumulado</th>
                  <th className="p-4 text-right">Faturamento Acumulado</th>
                  <th className="p-4 text-right">Lucro Líquido</th>
                  <th className="p-4 text-right">Margem (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-neutral-200">
                {Object.keys(productSummary).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-brand-silver print:text-black">Sem movimentações de lucro no período.</td>
                  </tr>
                ) : (
                  Object.entries(productSummary).map(([key, data]) => {
                    const profit = data.totalRevenue - data.totalCost
                    const margin = data.totalCost > 0 ? (profit / data.totalCost) * 100 : 0
                    return (
                      <tr key={key} className="hover:bg-white/[0.01] print:hover:bg-transparent">
                        <td className="p-4 text-white font-medium print:text-black">{data.name}</td>
                        <td className="p-4 text-center font-mono print:text-black">{data.qty} un</td>
                        <td className="p-4 text-right font-mono text-brand-silver print:text-neutral-500">{formatPrice(data.totalCost)}</td>
                        <td className="p-4 text-right font-mono text-white print:text-black">{formatPrice(data.totalRevenue)}</td>
                        <td className="p-4 text-right font-mono text-green-400 font-bold print:text-black">{formatPrice(profit)}</td>
                        <td className="p-4 text-right font-mono font-bold text-white print:text-black">{margin.toFixed(1)}%</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    if (reportType === 'clientes') {
      const salesMovements = reportMovements.filter((m) => m.type === 'saida')
      
      const customerMap: Record<string, { name: string, count: number, total: number, qty: number }> = {}
      salesMovements.forEach((m) => {
        const key = m.customer_name?.trim() || 'Cliente Não Identificado'
        if (!customerMap[key]) {
          customerMap[key] = {
            name: key,
            count: 0,
            total: 0,
            qty: 0
          }
        }
        customerMap[key].count += 1
        customerMap[key].total += m.quantity * (m.sale_price || 0)
        customerMap[key].qty += m.quantity
      })

      const customerList = Object.values(customerMap).sort((a, b) => b.total - a.total)
      const totalUniqueCustomers = customerList.length
      const highestSpender = customerList.length > 0 ? customerList[0] : null

      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-lg flex flex-col justify-between print:border-neutral-200 print:text-black">
              <span className="text-[9px] font-sans text-brand-gold uppercase tracking-widest print:text-neutral-500">Total de Clientes Atendidos no Período</span>
              <span className="text-2xl font-title text-white font-bold mt-2 print:text-black">{totalUniqueCustomers} clientes</span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-lg flex flex-col justify-between print:border-neutral-200 print:text-black">
              <span className="text-[9px] font-sans text-brand-gold uppercase tracking-widest print:text-neutral-500">Maior Comprador (Faturamento)</span>
              <span className="text-base font-title text-white font-bold mt-2 print:text-black">
                {highestSpender ? `${highestSpender.name} (${formatPrice(highestSpender.total)})` : '-'}
              </span>
            </div>
          </div>

          <div className="bg-black/35 border border-white/5 rounded-lg overflow-hidden print:border-neutral-200">
            <table className="w-full text-left border-collapse text-xs print:text-black">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-sans text-brand-silver uppercase tracking-wider print:border-neutral-200 print:text-neutral-600">
                  <th className="p-4">Cliente</th>
                  <th className="p-4 text-center">Transações</th>
                  <th className="p-4 text-center">Itens Comprados</th>
                  <th className="p-4 text-right">Total Gasto</th>
                  <th className="p-4 text-right">Ticket Médio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-neutral-200">
                {customerList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-brand-silver print:text-black">Sem compras registradas no período.</td>
                  </tr>
                ) : (
                  customerList.map((c) => {
                    const ticketMedium = c.count > 0 ? c.total / c.count : 0
                    return (
                      <tr key={c.name} className="hover:bg-white/[0.01] print:hover:bg-transparent">
                        <td className="p-4 text-white font-medium print:text-black">{c.name}</td>
                        <td className="p-4 text-center font-mono print:text-black">{c.count}</td>
                        <td className="p-4 text-center font-mono print:text-black">{c.qty} un</td>
                        <td className="p-4 text-right font-mono text-brand-gold-light font-bold print:text-black">{formatPrice(c.total)}</td>
                        <td className="p-4 text-right font-mono print:text-black">{formatPrice(ticketMedium)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    if (reportType === 'produto_especifico') {
      const selectedProd = products.find(p => p.id === reportProductId)
      const productMovements = reportMovements.filter((m) => m.product_id === reportProductId)

      const totalBought = productMovements.filter(m => m.type === 'entrada').reduce((acc, m) => acc + m.quantity, 0)
      const totalCostBought = productMovements.filter(m => m.type === 'entrada').reduce((acc, m) => acc + (m.quantity * (m.cost_price || 0)), 0)
      
      const totalSold = productMovements.filter(m => m.type === 'saida').reduce((acc, m) => acc + m.quantity, 0)
      const totalRevenueSold = productMovements.filter(m => m.type === 'saida').reduce((acc, m) => acc + (m.quantity * (m.sale_price || 0)), 0)
      const totalCostSold = productMovements.filter(m => m.type === 'saida').reduce((acc, m) => acc + (m.quantity * (m.cost_price || 0)), 0)
      const netProfit = totalRevenueSold - totalCostSold

      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-lg flex flex-col justify-between print:border-neutral-200 print:text-black">
              <span className="text-[9px] font-sans text-brand-gold uppercase tracking-widest print:text-neutral-500">Total Comprado (Período)</span>
              <span className="text-xl font-title text-white font-bold mt-2 print:text-black">
                {totalBought} un <span className="text-xs font-sans text-brand-silver font-normal">({formatPrice(totalCostBought)})</span>
              </span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-lg flex flex-col justify-between print:border-neutral-200 print:text-black">
              <span className="text-[9px] font-sans text-brand-gold uppercase tracking-widest print:text-neutral-500">Total Vendido (Período)</span>
              <span className="text-xl font-title text-white font-bold mt-2 print:text-black">
                {totalSold} un <span className="text-xs font-sans text-brand-silver font-normal">({formatPrice(totalRevenueSold)})</span>
              </span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-lg flex flex-col justify-between print:border-neutral-200 print:text-black">
              <span className="text-[9px] font-sans text-brand-gold uppercase tracking-widest print:text-neutral-500">Lucro Líquido (Período)</span>
              <span className="text-2xl font-title text-green-400 font-bold mt-2 print:text-black">{formatPrice(netProfit)}</span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-lg flex flex-col justify-between print:border-neutral-200 print:text-black">
              <span className="text-[9px] font-sans text-brand-gold uppercase tracking-widest print:text-neutral-500">Estoque Atual Físico</span>
              <span className="text-2xl font-title text-white font-bold mt-2 print:text-black">
                {selectedProd ? `${selectedProd.stock_quantity} un` : '-'}
              </span>
            </div>
          </div>

          <div className="bg-black/35 border border-white/5 rounded-lg overflow-hidden print:border-neutral-200">
            <table className="w-full text-left border-collapse text-xs print:text-black">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-sans text-brand-silver uppercase tracking-wider print:border-neutral-200 print:text-neutral-600">
                  <th className="p-4">Data</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4 text-center">Quantidade</th>
                  <th className="p-4 text-right">Preço Custo</th>
                  <th className="p-4 text-right">Preço Venda</th>
                  <th className="p-4 text-right">Total Movimento</th>
                  <th className="p-4">Detalhes/Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 print:divide-neutral-200">
                {productMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-brand-silver print:text-neutral-500">Nenhuma movimentação para o produto selecionado.</td>
                  </tr>
                ) : (
                  productMovements.map((m) => {
                    const price = m.type === 'entrada' ? m.cost_price : m.sale_price
                    const total = m.quantity * (price || 0)
                    return (
                      <tr key={m.id} className="hover:bg-white/[0.01] print:hover:bg-transparent">
                        <td className="p-4 font-mono text-brand-silver print:text-neutral-600">{new Date(m.movement_date).toLocaleDateString('pt-BR')}</td>
                        <td className="p-4 print:text-black">
                          {m.type === 'entrada' ? (
                            <span className="px-2 py-0.5 text-[8px] font-sans font-bold uppercase text-green-400 bg-green-950/45 border border-green-500/20 rounded">Compra</span>
                          ) : (
                            <span className="px-2 py-0.5 text-[8px] font-sans font-bold uppercase text-red-400 bg-red-950/45 border border-red-500/20 rounded">Venda</span>
                          )}
                        </td>
                        <td className="p-4 text-center font-mono print:text-black">{m.quantity} un</td>
                        <td className="p-4 text-right font-mono text-brand-silver print:text-neutral-600">{m.cost_price ? formatPrice(m.cost_price) : '-'}</td>
                        <td className="p-4 text-right font-mono print:text-neutral-600">{m.sale_price ? formatPrice(m.sale_price) : '-'}</td>
                        <td className="p-4 text-right font-mono text-white font-semibold print:text-black">{formatPrice(total)}</td>
                        <td className="p-4 text-brand-silver print:text-neutral-700 max-w-xs truncate">{m.type === 'saida' ? (m.customer_name || 'Geral') : (m.notes || 'Entrada de estoque')}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )
    }

    return null
  }

  // Format Helper
  const formatPrice = (price: number | null) => {
    if (price === null) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  return (
    <div className="space-y-12">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 print:hidden">
        <div>
          <h1 className="font-title text-2xl sm:text-3xl text-white uppercase tracking-wide">Movimentações</h1>
          <p className="font-sans text-xs text-brand-silver mt-1">Monitore compras, vendas, lucros e o fluxo de caixa do estoque</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsReportsModalOpen(true)}
            className="flex items-center gap-1.5 px-5 py-3 border border-white/10 text-brand-silver hover:text-white hover:border-brand-gold font-sans text-xs font-bold uppercase tracking-wider rounded transition-all duration-300"
          >
            <BarChart3 className="w-4 h-4 text-brand-gold" />
            Gerar Relatórios
          </button>

          <button
            onClick={handleOpenModal}
            className="flex items-center gap-1.5 px-5 py-3 bg-brand-gold text-black font-sans text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 transition-all duration-300"
          >
            <Plus className="w-4 h-4" />
            Registrar Movimentação
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center print:hidden">
        {/* Search Produto */}
        <div className="relative">
          <Search className="w-4 h-4 text-brand-silver absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por produto..."
            value={searchProduct}
            onChange={(e) => setSearchProduct(e.target.value)}
            className="w-full bg-brand-black border border-white/10 rounded pl-11 pr-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
          />
        </div>

        {/* Search Cliente */}
        <div className="relative">
          <Search className="w-4 h-4 text-brand-silver absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar por cliente..."
            value={searchCustomer}
            onChange={(e) => setSearchCustomer(e.target.value)}
            className="w-full bg-brand-black border border-white/10 rounded pl-11 pr-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
          />
        </div>

        {/* Tipo filter */}
        <div className="relative">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
            className="w-full bg-brand-black border border-white/10 text-xs font-sans text-white rounded px-4 py-3 focus:outline-none focus:border-brand-gold cursor-pointer appearance-none"
          >
            <option value="all">Todas as Movimentações</option>
            <option value="entrada">Entradas (Compras)</option>
            <option value="saida">Saídas (Vendas)</option>
          </select>
          <ChevronDown className="w-4 h-4 text-brand-silver absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Ordenar filter */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-brand-black border border-white/10 text-xs font-sans text-white rounded px-4 py-3 focus:outline-none focus:border-brand-gold cursor-pointer appearance-none"
          >
            <option value="date_desc">Data: Recentes primeiro</option>
            <option value="date_asc">Data: Antigos primeiro</option>
            <option value="product_asc">Produto: A - Z</option>
            <option value="product_desc">Produto: Z - A</option>
            <option value="customer_asc">Cliente: A - Z</option>
            <option value="customer_desc">Cliente: Z - A</option>
          </select>
          <ChevronDown className="w-4 h-4 text-brand-silver absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* TABELA */}
      {loading ? (
        <div className="py-20 text-center print:hidden">
          <Loader2 className="w-8 h-8 animate-spin text-brand-gold mx-auto" />
          <p className="text-xs font-sans text-brand-silver mt-3">Carregando livro caixa...</p>
        </div>
      ) : filteredAndSortedMovements.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-white/5 rounded print:hidden">
          <p className="text-xs font-sans text-brand-silver">Nenhuma movimentação registrada.</p>
        </div>
      ) : (
        <div className="bg-brand-black border border-white/5 rounded-lg p-6 print:hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-sans text-brand-silver uppercase tracking-wider">
                  <th className="py-4">Data</th>
                  <th className="py-4">Tipo</th>
                  <th className="py-4">Produto</th>
                  <th className="py-4">Qtd.</th>
                  <th className="py-4">Preço Pago (Custo)</th>
                  <th className="py-4">Preço Venda</th>
                  <th className="py-4">Lucro</th>
                  <th className="py-4">Cliente</th>
                  <th className="py-4">Pagamento</th>
                  <th className="py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-sans text-brand-white">
                {filteredAndSortedMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-white/5 transition-colors">
                    {/* Data */}
                    <td className="py-4 font-mono text-brand-silver">
                      {new Date(m.movement_date).toLocaleDateString('pt-BR')}
                    </td>

                    {/* Tipo */}
                    <td className="py-4">
                      {m.type === 'entrada' ? (
                        <span className="px-2.5 py-0.5 text-[9px] font-sans font-bold uppercase text-green-400 bg-green-950/45 border border-green-500/25 rounded">
                          Entrada
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 text-[9px] font-sans font-bold uppercase text-red-400 bg-red-950/45 border border-red-500/25 rounded">
                          Saída
                        </span>
                      )}
                    </td>

                    {/* Produto */}
                    <td className="py-4 font-semibold text-white max-w-xs truncate pr-4">
                      {m.products?.name || 'Produto Excluído'}
                    </td>

                    {/* Quantidade */}
                    <td className="py-4 font-mono">{m.quantity} un</td>

                    {/* Custo */}
                    <td className="py-4 font-mono text-brand-silver">
                      {formatPrice(m.cost_price)}
                    </td>

                    {/* Venda */}
                    <td className="py-4 font-mono font-semibold">
                      {formatPrice(m.sale_price)}
                    </td>

                    {/* Lucro */}
                    <td className="py-4 font-mono">
                      {m.type === 'saida' && m.profit_percentage !== null ? (
                        <span className={`font-bold ${m.profit_percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {m.profit_percentage}%
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Cliente */}
                    <td className="py-4 text-brand-silver max-w-xs truncate">
                      {m.customer_name || '-'}
                    </td>

                    {/* Status de Pagamento */}
                    <td className="py-4">
                      {m.type === 'entrada' ? (
                        <span className="text-[10px] text-green-400 font-bold uppercase">Pago</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {m.payment_type === 'vista' ? (
                            <span className="text-[10px] text-green-400 font-bold uppercase">À Vista</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-amber-400 font-bold uppercase">
                                Parcelado ({m.installments_paid}/{m.installments_total})
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleStepInstallment(m, -1)}
                                  className="w-4 h-4 flex items-center justify-center bg-white/5 border border-white/10 rounded hover:bg-white/10 font-bold text-white text-[10px]"
                                  title="Diminuir parcela paga"
                                  disabled={m.installments_paid <= 0}
                                >
                                  -
                                </button>
                                <button
                                  onClick={() => handleStepInstallment(m, 1)}
                                  className="w-4 h-4 flex items-center justify-center bg-white/5 border border-white/10 rounded hover:bg-white/10 font-bold text-white text-[10px]"
                                  title="Aumentar parcela paga"
                                  disabled={m.installments_paid >= m.installments_total}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          )}

                          {m.payment_status === 'pago' && (
                            <span className="text-[9px] font-sans font-bold uppercase text-green-400 bg-green-950/45 border border-green-500/25 px-1.5 py-0.5 rounded w-max">
                              Quitado
                            </span>
                          )}
                          {m.payment_status === 'parcialmente_pago' && (
                            <span className="text-[9px] font-sans font-bold uppercase text-amber-400 bg-amber-950/45 border border-amber-500/25 px-1.5 py-0.5 rounded w-max">
                              Parcial
                            </span>
                          )}
                          {m.payment_status === 'pendente' && (
                            <span className="text-[9px] font-sans font-bold uppercase text-red-400 bg-red-950/45 border border-red-500/25 px-1.5 py-0.5 rounded w-max">
                              Pendente
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {m.notes && (
                          <button
                            onClick={() => alert(`Observação:\n${m.notes}`)}
                            className="p-2 text-brand-silver hover:text-brand-gold bg-white/5 border border-white/10 rounded transition-colors"
                            title="Ver Observação"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMovement(m.id)}
                          className="p-2 text-brand-silver hover:text-red-500 bg-white/5 border border-white/10 hover:border-red-500/20 rounded transition-colors"
                          title="Excluir Movimentação"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL RELATÓRIOS */}
      {isReportsModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto print:absolute print:inset-0 print:bg-white print:text-black print:p-0 print:backdrop-blur-none">
          <div className="bg-brand-black border border-white/10 rounded-xl max-w-6xl w-full p-8 space-y-6 relative max-h-[90vh] overflow-y-auto print:border-none print:bg-white print:text-black print:max-h-none print:overflow-visible print:p-0 print:shadow-none">
            {/* Close */}
            <button
              onClick={() => setIsReportsModalOpen(false)}
              className="absolute top-6 right-6 p-1.5 border border-white/10 rounded text-brand-silver hover:text-white transition-colors print:hidden"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4 print:border-neutral-200">
              <div>
                <h3 className="font-title text-xl text-white uppercase tracking-wide flex items-center gap-2 print:text-black print:text-2xl">
                  <BarChart3 className="w-5 h-5 text-brand-gold print:text-black" />
                  Painel de Relatórios Analíticos
                </h3>
                <p className="font-sans text-[11px] text-brand-silver mt-1 print:text-neutral-500">
                  {reportType === 'estoque' && 'Relatório de Posição de Estoque Físico e Financeiro'}
                  {reportType === 'vendas' && `Relatório de Vendas de ${new Date(reportStartDate + 'T00:00:00').toLocaleDateString('pt-BR')} até ${new Date(reportEndDate + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                  {reportType === 'lucro' && `Demonstrativo de Resultado (CMV / Lucros) de ${new Date(reportStartDate + 'T00:00:00').toLocaleDateString('pt-BR')} até ${new Date(reportEndDate + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                  {reportType === 'clientes' && `Performance e Histórico de Clientes de ${new Date(reportStartDate + 'T00:00:00').toLocaleDateString('pt-BR')} até ${new Date(reportEndDate + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                  {reportType === 'produto_especifico' && `Histórico e Lucratividade do Produto de ${new Date(reportStartDate + 'T00:00:00').toLocaleDateString('pt-BR')} até ${new Date(reportEndDate + 'T00:00:00').toLocaleDateString('pt-BR')}`}
                </p>
              </div>

              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 hover:border-brand-gold text-white text-xs font-sans font-bold uppercase tracking-wider rounded transition-all duration-300 print:hidden"
              >
                <Printer className="w-4 h-4 text-brand-gold" />
                Imprimir Relatório
              </button>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-black/40 border border-white/5 rounded-lg print:hidden">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-sans text-brand-gold uppercase tracking-widest">Tipo de Relatório</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="bg-brand-black border border-white/10 text-xs font-sans text-white rounded p-2.5 focus:outline-none focus:border-brand-gold cursor-pointer"
                >
                  <option value="estoque">Inventário de Estoque</option>
                  <option value="vendas">Faturamento de Vendas</option>
                  <option value="lucro">DRE / Lucratividade</option>
                  <option value="clientes">Performance de Clientes</option>
                  <option value="produto_especifico">Produto Específico</option>
                </select>
              </div>

              <div className={`flex flex-col gap-1 ${reportType === 'estoque' ? 'opacity-40 pointer-events-none' : ''}`}>
                <label className="text-[9px] font-sans text-brand-gold uppercase tracking-widest">Data Inicial</label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="bg-brand-black border border-white/10 text-xs font-sans text-white rounded p-2.5 focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className={`flex flex-col gap-1 ${reportType === 'estoque' ? 'opacity-40 pointer-events-none' : ''}`}>
                <label className="text-[9px] font-sans text-brand-gold uppercase tracking-widest">Data Final</label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="bg-brand-black border border-white/10 text-xs font-sans text-white rounded p-2.5 focus:outline-none focus:border-brand-gold"
                />
              </div>

              <div className={`flex flex-col gap-1 ${reportType !== 'produto_especifico' ? 'opacity-30 pointer-events-none' : ''}`}>
                <label className="text-[9px] font-sans text-brand-gold uppercase tracking-widest">Produto Selecionado</label>
                <select
                  value={reportProductId}
                  onChange={(e) => setReportProductId(e.target.value)}
                  disabled={reportType !== 'produto_especifico'}
                  className="bg-brand-black border border-white/10 text-xs font-sans text-white rounded p-2.5 focus:outline-none focus:border-brand-gold cursor-pointer disabled:cursor-not-allowed"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Report Rendering */}
            <div className="space-y-6">
              {renderActiveReport()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CADASTRAR */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-brand-black border border-white/10 rounded-lg max-w-xl w-full p-8 space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Close */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-1.5 border border-white/10 rounded text-brand-silver hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title */}
            <div>
              <h3 className="font-title text-lg text-white uppercase tracking-wide flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-brand-gold" />
                Registrar Movimentação
              </h3>
              <p className="font-sans text-[11px] text-brand-silver mt-1">Lançamento automático de fluxo de entrada/saída do estoque</p>
            </div>

            <form onSubmit={handleCreateMovement} className="space-y-5">
              {/* Produto */}
              <div>
                <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-1.5">Produto *</label>
                <select
                  required
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white cursor-pointer"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Estoque: {p.stock_quantity || 0} un)
                    </option>
                  ))}
                </select>
                {(() => {
                  const p = products.find(prod => prod.id === productId)
                  if (!p) return null
                  return (
                    <div className="mt-2 text-[10px] font-sans text-brand-silver flex justify-between px-1">
                      <span>Preço base: <strong className="text-white">{formatPrice(p.price)}</strong></span>
                      <span>Disponível em estoque: <strong className={(p.stock_quantity || 0) > 0 ? "text-green-400" : "text-red-400"}>{p.stock_quantity || 0} un</strong></span>
                    </div>
                  )
                })()}
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-1.5">Tipo de Movimentação *</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setType('entrada')}
                    className={`py-3 text-xs font-sans font-bold uppercase rounded border transition-all ${
                      type === 'entrada'
                        ? 'bg-green-950/45 border-green-500 text-green-400 font-bold'
                        : 'border-white/10 text-brand-silver hover:text-white'
                    }`}
                  >
                    Compra (Entrada de estoque)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('saida')}
                    className={`py-3 text-xs font-sans font-bold uppercase rounded border transition-all ${
                      type === 'saida'
                        ? 'bg-red-950/45 border-red-500 text-red-400 font-bold'
                        : 'border-white/10 text-brand-silver hover:text-white'
                    }`}
                  >
                    Venda (Saída de estoque)
                  </button>
                </div>
              </div>

              {/* Quantidade e Data */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-1.5">Quantidade *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-1.5">Data *</label>
                  <input
                    type="date"
                    required
                    value={movementDate}
                    onChange={(e) => setMovementDate(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
                  />
                </div>
              </div>

              {/* ENTRADA SPECS */}
              {type === 'entrada' && (
                <div>
                  <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-1.5">Preço Unitário Pago (Custo) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-silver text-xs font-mono">R$</span>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-black border border-white/10 rounded pl-10 pr-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
                    />
                  </div>
                </div>
              )}

              {/* SAIDA SPECS */}
              {type === 'saida' && (
                <div className="space-y-4">
                  {/* Custo do item e Preço de venda */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-1.5">Preço de Custo (Unitário) *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-silver text-xs font-mono">R$</span>
                        <input
                          type="number"
                          required
                          step="0.01"
                          min="0"
                          value={costPrice}
                          onChange={(e) => setCostPrice(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-black border border-white/10 rounded pl-10 pr-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
                        />
                      </div>
                      
                      {recentPurchases.length > 0 ? (
                        <div className="mt-2.5">
                          <label className="block text-[9px] font-sans text-brand-silver uppercase tracking-wider mb-1">
                            Selecionar preço de lote de compra anterior:
                          </label>
                          <select
                            onChange={(e) => {
                              const val = e.target.value
                              if (val) {
                                setCostPrice(val)
                              }
                            }}
                            value={costPrice}
                            className="w-full bg-black border border-white/10 rounded px-3 py-2 text-[10px] font-sans focus:outline-none focus:border-brand-gold text-brand-silver cursor-pointer"
                          >
                            {recentPurchases.map((purchase) => (
                              <option key={purchase.id} value={purchase.cost_price}>
                                Compra: {new Date(purchase.movement_date).toLocaleDateString('pt-BR')} - R$ {purchase.cost_price.toFixed(2)} ({purchase.quantity} un)
                              </option>
                            ))}
                            <option value="">Valor personalizado...</option>
                          </select>
                        </div>
                      ) : (
                        lastCostPriceMsg && (
                          <p className="text-[9px] text-brand-silver font-sans mt-1.5 leading-tight">{lastCostPriceMsg}</p>
                        )
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-1.5">Preço de Venda (Unitário) *</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-silver text-xs font-mono">R$</span>
                        <input
                          type="number"
                          required
                          step="0.01"
                          min="0"
                          value={salePrice}
                          onChange={(e) => setSalePrice(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-black border border-white/10 rounded pl-10 pr-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
                        />
                      </div>
                      {calculatedProfit !== null && (
                        <div className="text-[10px] font-sans mt-1.5 flex items-center gap-1.5">
                          <span className="text-brand-silver">Lucro Projetado:</span>
                          <span className={`font-bold ${calculatedProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {calculatedProfit}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cliente */}
                  <div>
                    <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-1.5">Cliente (Nome) *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: João Silva"
                      className="w-full bg-black border border-white/10 rounded px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
                    />
                  </div>

                  {/* Condição de Pagamento */}
                  <div>
                    <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-1.5">Tipo de Pagamento *</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setPaymentType('vista')}
                        className={`py-3 text-xs font-sans font-bold uppercase rounded border transition-all ${
                          paymentType === 'vista'
                            ? 'bg-green-950/45 border-green-500 text-green-400 font-bold'
                            : 'border-white/10 text-brand-silver hover:text-white'
                        }`}
                      >
                        À Vista
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentType('parcelado')}
                        className={`py-3 text-xs font-sans font-bold uppercase rounded border transition-all ${
                          paymentType === 'parcelado'
                            ? 'bg-amber-950/45 border-amber-500 text-amber-400 font-bold'
                            : 'border-white/10 text-brand-silver hover:text-white'
                        }`}
                      >
                        Parcelado
                      </button>
                    </div>
                  </div>

                  {/* Parcelamento Specs */}
                  {paymentType === 'parcelado' && (
                    <div className="grid grid-cols-2 gap-4 bg-white/5 border border-white/5 p-4 rounded-lg">
                      <div>
                        <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-1.5">Total de Parcelas *</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={installmentsTotal}
                          onChange={(e) => setInstallmentsTotal(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-1.5">Parcelas Pagas *</label>
                        <input
                          type="number"
                          required
                          min="0"
                          max={installmentsTotal}
                          value={installmentsPaid}
                          onChange={(e) => setInstallmentsPaid(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Observações */}
              <div>
                <label className="block text-[10px] font-sans text-brand-gold uppercase tracking-widest mb-1.5">Observação (Opcional)</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Informações adicionais..."
                  className="w-full bg-black border border-white/10 rounded px-4 py-3 text-xs font-sans focus:outline-none focus:border-brand-gold text-white resize-none"
                />
              </div>

              {/* BOTOES */}
              <div className="flex gap-4 pt-4 border-t border-white/5">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 flex items-center justify-center gap-2 py-4 bg-gold-gradient text-black font-sans font-bold text-xs uppercase tracking-widest rounded hover:opacity-90 transition-all duration-300 disabled:opacity-50"
                >
                  {submitLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando lançamento...
                    </>
                  ) : (
                    'Salvar Lançamento'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-4 bg-transparent border border-white/20 text-white font-sans font-bold text-xs uppercase tracking-widest rounded hover:border-white hover:text-white transition-all duration-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
