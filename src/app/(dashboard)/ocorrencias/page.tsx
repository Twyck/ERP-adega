'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, AlertTriangle } from 'lucide-react'
import { formatDateTime, TIPO_OCORRENCIA_LABELS } from '@/lib/utils'

type TipoOcorrencia = 'AMASSADO' | 'VENCIDO' | 'QUEBRADO' | 'DANIFICADO' | 'OUTRO'

interface Ocorrencia {
  id: string
  tipo: TipoOcorrencia
  quantidade: number
  descricao?: string | null
  criadoEm: string
  produto: { nome: string; marca?: string | null }
  usuario: { nome: string }
}

interface Produto { id: string; nome: string }

const TIPO_CORES: Record<TipoOcorrencia, string> = {
  VENCIDO: 'text-red-400 bg-red-950 border-red-800',
  QUEBRADO: 'text-orange-400 bg-orange-950 border-orange-800',
  AMASSADO: 'text-yellow-400 bg-yellow-950 border-yellow-800',
  DANIFICADO: 'text-purple-400 bg-purple-950 border-purple-800',
  OUTRO: 'text-zinc-400 bg-zinc-800 border-zinc-700',
}

export default function OcorrenciasPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    produtoId: '', tipo: 'OUTRO' as TipoOcorrencia, quantidade: '1', descricao: ''
  })
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(async () => {
    const [or, pr] = await Promise.all([
      fetch('/api/ocorrencias').then(r => r.json()),
      fetch('/api/produtos?limit=200').then(r => r.json()),
    ])
    setOcorrencias(or.ocorrencias || [])
    setProdutos(pr.produtos || [])
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function registrar() {
    if (!form.produtoId) return
    setSalvando(true)
    await fetch('/api/ocorrencias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, quantidade: parseInt(form.quantidade) }),
    })
    setSalvando(false)
    setShowModal(false)
    setForm({ produtoId: '', tipo: 'OUTRO', quantidade: '1', descricao: '' })
    carregar()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Ocorrências</h1>
          <p className="text-zinc-500 text-sm">{ocorrencias.length} registros</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black font-semibold rounded-lg text-sm"
        >
          <Plus className="w-4 h-4" /> Registrar
        </button>
      </div>

      <div className="space-y-3">
        {ocorrencias.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-xl">
            <AlertTriangle className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
            <p className="text-zinc-600 text-sm">Sem ocorrências registradas</p>
          </div>
        ) : (
          ocorrencias.map(oc => (
            <div key={oc.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-3">
              <span className={`text-xs border rounded px-2 py-1 font-medium ${TIPO_CORES[oc.tipo]} shrink-0`}>
                {TIPO_OCORRENCIA_LABELS[oc.tipo]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{oc.produto.nome}</p>
                {oc.descricao && <p className="text-zinc-500 text-xs mt-0.5">{oc.descricao}</p>}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-zinc-600 text-xs">{oc.usuario.nome}</span>
                  <span className="text-zinc-700 text-xs">{formatDateTime(oc.criadoEm)}</span>
                </div>
              </div>
              <span className="text-white font-bold text-sm shrink-0">{oc.quantidade} un.</span>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-white font-semibold">Registrar ocorrência</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Produto *</label>
                <select
                  value={form.produtoId}
                  onChange={e => setForm(p => ({ ...p, produtoId: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                >
                  <option value="">Selecione o produto...</option>
                  {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={e => setForm(p => ({ ...p, tipo: e.target.value as TipoOcorrencia }))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                  >
                    {Object.entries(TIPO_OCORRENCIA_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    value={form.quantidade}
                    onChange={e => setForm(p => ({ ...p, quantidade: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Descrição (opcional)</label>
                <textarea
                  value={form.descricao}
                  onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>
              <button
                onClick={registrar}
                disabled={salvando || !form.produtoId}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black font-semibold rounded-lg text-sm"
              >
                {salvando ? 'Registrando...' : 'Registrar ocorrência'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
