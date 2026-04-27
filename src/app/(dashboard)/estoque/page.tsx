'use client'
import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, Package, AlertTriangle, Edit2, ToggleLeft, ToggleRight } from 'lucide-react'
import { formatCurrency, calcularMargem } from '@/lib/utils'

interface Produto {
  id: string
  nome: string
  marca?: string | null
  volume?: string | null
  categoria?: string | null
  codigoBarras?: string | null
  precoVenda: number
  precoCusto?: number | null
  estoqueAtual: number
  estoqueMinimo: number
  ativo: boolean
}

function ModalProduto({
  produto,
  onClose,
  onSave,
}: {
  produto: Produto | null
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    nome: produto?.nome || '',
    marca: produto?.marca || '',
    volume: produto?.volume || '',
    categoria: produto?.categoria || '',
    codigoBarras: produto?.codigoBarras || '',
    precoVenda: produto?.precoVenda?.toString() || '',
    precoCusto: produto?.precoCusto?.toString() || '',
    estoqueAtual: produto?.estoqueAtual?.toString() || '0',
    estoqueMinimo: produto?.estoqueMinimo?.toString() || '5',
  })
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    if (!form.nome || !form.precoVenda) return
    setSalvando(true)
    const method = produto ? 'PUT' : 'POST'
    const url = produto ? `/api/produtos/${produto.id}` : '/api/produtos'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        precoVenda: parseFloat(form.precoVenda),
        precoCusto: form.precoCusto ? parseFloat(form.precoCusto) : null,
        estoqueAtual: parseInt(form.estoqueAtual),
        estoqueMinimo: parseInt(form.estoqueMinimo),
      }),
    })
    setSalvando(false)
    onSave()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 sticky top-0 bg-zinc-900">
          <h2 className="text-white font-semibold">{produto ? 'Editar produto' : 'Novo produto'}</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: 'Nome *', key: 'nome', span: 2 },
              { label: 'Marca', key: 'marca' },
              { label: 'Volume', key: 'volume' },
              { label: 'Categoria', key: 'categoria' },
              { label: 'Código de barras', key: 'codigoBarras' },
              { label: 'Preço de venda (R$) *', key: 'precoVenda', type: 'number' },
              { label: 'Preço de custo (R$)', key: 'precoCusto', type: 'number' },
              { label: 'Estoque atual', key: 'estoqueAtual', type: 'number' },
              { label: 'Estoque mínimo', key: 'estoqueMinimo', type: 'number' },
            ].map(field => (
              <div key={field.key} className={field.span === 2 ? 'col-span-2' : ''}>
                <label className="block text-xs text-zinc-400 mb-1">{field.label}</label>
                <input
                  type={field.type || 'text'}
                  value={(form as any)[field.key]}
                  onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                  step={field.type === 'number' ? '0.01' : undefined}
                />
              </div>
            ))}
          </div>
          {form.precoVenda && form.precoCusto && (
            <div className="bg-zinc-950 rounded-lg p-3 text-sm">
              <span className="text-zinc-400">Margem bruta: </span>
              <span className="text-green-400 font-semibold">
                {calcularMargem(parseFloat(form.precoVenda), parseFloat(form.precoCusto)).toFixed(1)}%
              </span>
            </div>
          )}
          <button
            onClick={salvar}
            disabled={salvando || !form.nome || !form.precoVenda}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black font-semibold rounded-lg text-sm"
          >
            {salvando ? 'Salvando...' : 'Salvar produto'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<'todos' | 'baixo' | 'inativos'>('todos')
  const [modal, setModal] = useState<'novo' | Produto | null>(null)
  const [carregando, setCarregando] = useState(true)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const res = await fetch(`/api/produtos?busca=${encodeURIComponent(busca)}&limit=100`)
    const data = await res.json()
    setProdutos(data.produtos || [])
    setCarregando(false)
  }, [busca])

  useEffect(() => { carregar() }, [carregar])

  const produtosFiltrados = produtos.filter(p => {
    if (filtro === 'baixo') return p.estoqueAtual <= p.estoqueMinimo && p.ativo
    if (filtro === 'inativos') return !p.ativo
    return p.ativo
  })

  async function toggleAtivo(produto: Produto) {
    await fetch(`/api/produtos/${produto.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...produto, ativo: !produto.ativo }),
    })
    carregar()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Estoque</h1>
          <p className="text-zinc-500 text-sm">{produtosFiltrados.length} produtos</p>
        </div>
        <button
          onClick={() => setModal('novo')}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black font-semibold rounded-lg text-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo produto
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-orange-500 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {(['todos', 'baixo', 'inativos'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                filtro === f ? 'bg-orange-500 text-black' : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {f === 'todos' ? 'Todos' : f === 'baixo' ? '⚠ Baixo' : 'Inativos'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {carregando ? (
          <div className="text-center py-12 text-zinc-600 text-sm">Carregando...</div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
            <p className="text-zinc-600 text-sm">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Produto', 'Categoria', 'Preço', 'Custo', 'Margem', 'Estoque', 'Ações'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-zinc-500 text-xs font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.map(produto => {
                  const margem = produto.precoCusto
                    ? calcularMargem(produto.precoVenda, produto.precoCusto)
                    : null
                  const estoqueBaixo = produto.estoqueAtual <= produto.estoqueMinimo
                  return (
                    <tr key={produto.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50">
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{produto.nome}</p>
                        <p className="text-zinc-500 text-xs">{produto.marca} {produto.volume}</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{produto.categoria || '—'}</td>
                      <td className="px-4 py-3 text-white font-medium">{formatCurrency(produto.precoVenda)}</td>
                      <td className="px-4 py-3 text-zinc-400">{produto.precoCusto ? formatCurrency(produto.precoCusto) : '—'}</td>
                      <td className="px-4 py-3">
                        {margem !== null ? (
                          <span className={`text-xs font-semibold ${margem >= 30 ? 'text-green-400' : margem >= 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                            {margem.toFixed(1)}%
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {estoqueBaixo && <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />}
                          <span className={estoqueBaixo ? 'text-orange-400 font-bold' : 'text-white'}>
                            {produto.estoqueAtual}
                          </span>
                          <span className="text-zinc-600 text-xs">/{produto.estoqueMinimo}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setModal(produto)}
                            className="text-zinc-500 hover:text-orange-400 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleAtivo(produto)}
                            className={`transition-colors ${produto.ativo ? 'text-zinc-500 hover:text-red-400' : 'text-zinc-600 hover:text-green-400'}`}
                          >
                            {produto.ativo ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal !== null && (
        <ModalProduto
          produto={modal === 'novo' ? null : modal}
          onClose={() => setModal(null)}
          onSave={carregar}
        />
      )}
    </div>
  )
}
