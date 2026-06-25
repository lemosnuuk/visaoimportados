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
  DollarSign
} from 'lucide-react'

interface Product {
  id: string
  name: string
  price: number
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
        .select('id, name, price')
        .order('name')

      if (pErr) throw pErr
      if (dbProducts) {
        setProducts(dbProducts)
        if (dbProducts.length > 0) setProductId(dbProducts[0].id)
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

    setSubmitLoading(true)

    try {
      const qty = parseInt(quantity)
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="font-title text-2xl sm:text-3xl text-white uppercase tracking-wide">Movimentações</h1>
          <p className="font-sans text-xs text-brand-silver mt-1">Monitore compras, vendas, lucros e o fluxo de caixa do estoque</p>
        </div>

        <button
          onClick={handleOpenModal}
          className="flex items-center gap-1.5 px-5 py-3 bg-brand-gold text-black font-sans text-xs font-bold uppercase tracking-wider rounded hover:opacity-90 transition-all duration-300"
        >
          <Plus className="w-4 h-4" />
          Registrar Movimentação
        </button>
      </div>

      {/* FILTROS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
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
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-gold mx-auto" />
          <p className="text-xs font-sans text-brand-silver mt-3">Carregando livro caixa...</p>
        </div>
      ) : filteredAndSortedMovements.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-white/5 rounded">
          <p className="text-xs font-sans text-brand-silver">Nenhuma movimentação registrada.</p>
        </div>
      ) : (
        <div className="bg-brand-black border border-white/5 rounded-lg p-6">
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
                      {p.name} (Ref: {formatPrice(p.price)})
                    </option>
                  ))}
                </select>
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
