'use client'
import { useState, useRef, useEffect } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Produto {
  id: string
  nome: string
  marca?: string | null
  volume?: string | null
  codigoBarras?: string | null
  precoVenda: number
  estoqueAtual: number
}

interface ItemCarrinho {
  produto: Produto
  quantidade: number
}

type TipoPagamento = 'DINHEIRO' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'PIX' | 'OUTRO'

const PAGAMENTOS = [
  { value: 'PIX', label: 'PIX' },
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'CARTAO_DEBITO', label: 'Débito' },
  { value: 'CARTAO_CREDITO', label: 'Crédito' },
]

export default function PDVPage() {
  const [busca, setBusca] = useState('')
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [pagamento, setPagamento] = useState<TipoPagamento>('PIX')
  const [finalizando, setFinalizando] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const buscaRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (buscaRef.current) clearTimeout(buscaRef.current)
    if (busca.length < 2) { setProdutos([]); return }

    buscaRef.current = setTimeout(async () => {
      setBuscando(true)
      const res = await fetch(`/api/produtos?busca=${encodeURIComponent(busca)}&limit=8`)
      const data = await res.json()
      setProdutos(data.produtos || [])
      setBuscando(false)
    }, 300)
  }, [busca])

  function adicionarItem(produto: Produto) {
    setCarrinho(prev => {
      const exists = prev.find(i => i.produto.id === produto.id)
      if (exists) {
        return prev.map(i =>
          i.produto.id === produto.id
            ? { ...i, quantidade: Math.min(i.quantidade + 1, produto.estoqueAtual) }
            : i
        )
      }
      return [...prev, { produto, quantidade: 1 }]
    })
    setBusca('')
    setProdutos([])
  }

  function alterarQuantidade(id: string, delta: number) {
    setCarrinho(prev => prev
      .map(i => i.produto.id === id ? { ...i, quantidade: i.quantidade + delta } : i)
      .filter(i => i.quantidade > 0)
    )
  }

  function removerItem(id: string) {
    setCarrinho(prev => prev.filter(i => i.produto.id !== id))
  }

  const total = carrinho.reduce((sum, i) => sum + i.produto.precoVenda * i.quantidade, 0)

  async function finalizarVenda() {
    if (carrinho.length === 0) return
    setFinalizando(true)
    try {
      const res = await fetch('/api/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoPagamento: pagamento,
          itens: carrinho.map(i => ({
            produtoId: i.produto.id,
            quantidade: i.quantidade,
            precoUnitario: i.produto.precoVenda,
          })),
        }),
      })
      if (res.ok) {
        setSucesso(true)
        setCarrinho([])
        setTimeout(() => setSucesso(false), 3000)
      }
    } finally {
      setFinalizando(false)
    }
  }

  return (
    <div className="h-full flex flex-col md:flex-row gap-4">
      {/* Left - product search */}
      <div className="flex-1 flex flex-col min-h-0">
        <div>
          <h1 className="text-xl font-semibold text-white mb-4">PDV / Caixa</h1>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar produto por nome ou código de barras..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 text-sm"
            />
            {buscando && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-zinc-600 border-t-orange-500 rounded-full animate-spin" />
            )}
          </div>

          {/* Results */}
          {produtos.length > 0 && (
            <div className="mt-2 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              {produtos.map(produto => (
                <button
                  key={produto.id}
                  onClick={() => adicionarItem(produto)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-0 text-left"
                >
                  <div>
                    <p className="text-white text-sm font-medium">{produto.nome}</p>
                    <p className="text-zinc-500 text-xs">
                      {produto.marca} {produto.volume} · Estoque: {produto.estoqueAtual}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-400 font-semibold text-sm">
                      {formatCurrency(produto.precoVenda)}
                    </p>
                    <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center ml-auto mt-1">
                      <Plus className="w-3 h-3 text-black" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {busca.length >= 2 && produtos.length === 0 && !buscando && (
            <p className="text-zinc-600 text-sm mt-3 text-center">Nenhum produto encontrado</p>
          )}
        </div>
      </div>

      {/* Right - cart */}
      <div className="w-full md:w-80 lg:w-96 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-orange-400" />
          <h2 className="text-white font-semibold text-sm">
            Carrinho · {carrinho.length} {carrinho.length === 1 ? 'item' : 'itens'}
          </h2>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {carrinho.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-600 text-sm">Carrinho vazio</p>
              <p className="text-zinc-700 text-xs mt-1">Busque um produto para adicionar</p>
            </div>
          ) : (
            carrinho.map(item => (
              <div key={item.produto.id} className="bg-zinc-950 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-white text-sm font-medium leading-tight flex-1 pr-2">{item.produto.nome}</p>
                  <button
                    onClick={() => removerItem(item.produto.id)}
                    className="text-zinc-600 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => alterarQuantidade(item.produto.id, -1)}
                      className="w-6 h-6 bg-zinc-800 rounded-md flex items-center justify-center text-zinc-400 hover:text-white"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-white text-sm font-medium w-6 text-center">{item.quantidade}</span>
                    <button
                      onClick={() => alterarQuantidade(item.produto.id, 1)}
                      disabled={item.quantidade >= item.produto.estoqueAtual}
                      className="w-6 h-6 bg-zinc-800 rounded-md flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-30"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-orange-400 font-semibold text-sm">
                    {formatCurrency(item.produto.precoVenda * item.quantidade)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Payment + total */}
        {carrinho.length > 0 && (
          <div className="p-4 border-t border-zinc-800 space-y-4">
            {/* Payment type */}
            <div>
              <p className="text-zinc-400 text-xs mb-2">Forma de pagamento</p>
              <div className="grid grid-cols-2 gap-2">
                {PAGAMENTOS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPagamento(p.value as TipoPagamento)}
                    className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                      pagamento === p.value
                        ? 'bg-orange-500 text-black'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 text-sm">Total</span>
              <span className="text-white text-xl font-bold">{formatCurrency(total)}</span>
            </div>

            {/* Finalize */}
            {sucesso ? (
              <div className="flex items-center justify-center gap-2 py-3 bg-green-950 border border-green-800 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-medium">Venda registrada!</span>
              </div>
            ) : (
              <button
                onClick={finalizarVenda}
                disabled={finalizando}
                className="w-full py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black font-bold rounded-lg transition-colors"
              >
                {finalizando ? 'Registrando...' : `Finalizar · ${formatCurrency(total)}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
