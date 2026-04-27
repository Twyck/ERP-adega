'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, CheckCircle, Clock, AlertCircle, User } from 'lucide-react'
import { formatDateTime, PERFIL_LABELS } from '@/lib/utils'
import { useSession } from 'next-auth/react'

type Status = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA'
type Prioridade = 'URGENTE' | 'HOJE' | 'SEM_PRAZO'

interface Tarefa {
  id: string
  titulo: string
  descricao?: string | null
  prioridade: Prioridade
  status: Status
  prazo?: string | null
  criadoEm: string
  criador: { nome: string }
  responsavel: { id: string; nome: string }
}

interface Usuario { id: string; nome: string; perfil: string }

const PRIORIDADE_CORES: Record<Prioridade, string> = {
  URGENTE: 'bg-red-950 text-red-400 border-red-800',
  HOJE: 'bg-yellow-950 text-yellow-400 border-yellow-800',
  SEM_PRAZO: 'bg-zinc-800 text-zinc-400 border-zinc-700',
}

const STATUS_ICONES: Record<Status, React.ReactNode> = {
  PENDENTE: <Clock className="w-4 h-4 text-yellow-400" />,
  EM_ANDAMENTO: <AlertCircle className="w-4 h-4 text-blue-400" />,
  CONCLUIDA: <CheckCircle className="w-4 h-4 text-green-400" />,
}

export default function TarefasPage() {
  const { data: session } = useSession()
  const perfil = session?.user?.perfil
  const podecriar = perfil === 'DONO' || perfil === 'GERENTE'

  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [filtro, setFiltro] = useState<'todas' | Status>('todas')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    titulo: '', descricao: '', responsavelId: '', prioridade: 'SEM_PRAZO' as Prioridade, prazo: ''
  })
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(async () => {
    const [tr, ur] = await Promise.all([
      fetch('/api/tarefas').then(r => r.json()),
      fetch('/api/usuarios').then(r => r.json()),
    ])
    setTarefas(tr.tarefas || [])
    setUsuarios(ur.usuarios || [])
  }, [])

  useEffect(() => { carregar() }, [carregar])

  async function criarTarefa() {
    if (!form.titulo || !form.responsavelId) return
    setSalvando(true)
    await fetch('/api/tarefas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSalvando(false)
    setShowModal(false)
    setForm({ titulo: '', descricao: '', responsavelId: '', prioridade: 'SEM_PRAZO', prazo: '' })
    carregar()
  }

  async function atualizarStatus(id: string, status: Status) {
    await fetch(`/api/tarefas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    carregar()
  }

  const filtradas = tarefas.filter(t =>
    filtro === 'todas' ? true : t.status === filtro
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Tarefas</h1>
          <p className="text-zinc-500 text-sm">{filtradas.length} tarefas</p>
        </div>
        {podecriar && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black font-semibold rounded-lg text-sm"
          >
            <Plus className="w-4 h-4" /> Nova tarefa
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          ['todas', 'Todas'],
          ['PENDENTE', 'Pendentes'],
          ['EM_ANDAMENTO', 'Em andamento'],
          ['CONCLUIDA', 'Concluídas'],
        ] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFiltro(val)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filtro === val ? 'bg-orange-500 text-black' : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tasks list */}
      <div className="space-y-3">
        {filtradas.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900 border border-zinc-800 rounded-xl">
            <CheckCircle className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
            <p className="text-zinc-600 text-sm">Nenhuma tarefa</p>
          </div>
        ) : (
          filtradas.map(tarefa => (
            <div key={tarefa.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-0.5">{STATUS_ICONES[tarefa.status]}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${tarefa.status === 'CONCLUIDA' ? 'text-zinc-500 line-through' : 'text-white'}`}>
                      {tarefa.titulo}
                    </p>
                    {tarefa.descricao && (
                      <p className="text-zinc-500 text-xs mt-0.5">{tarefa.descricao}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className={`text-xs border rounded px-1.5 py-0.5 ${PRIORIDADE_CORES[tarefa.prioridade]}`}>
                        {tarefa.prioridade.replace('_', ' ')}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <User className="w-3 h-3" /> {tarefa.responsavel.nome}
                      </span>
                      {tarefa.prazo && (
                        <span className="text-xs text-zinc-600">{formatDateTime(tarefa.prazo)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {tarefa.status !== 'CONCLUIDA' && (
                  <div className="flex gap-1 shrink-0">
                    {tarefa.status === 'PENDENTE' && (
                      <button
                        onClick={() => atualizarStatus(tarefa.id, 'EM_ANDAMENTO')}
                        className="text-xs px-2 py-1 bg-blue-950 text-blue-400 border border-blue-800 rounded hover:bg-blue-900 transition-colors"
                      >
                        Iniciar
                      </button>
                    )}
                    {(tarefa.responsavel.id === session?.user?.id || podecriar) && (
                      <button
                        onClick={() => atualizarStatus(tarefa.id, 'CONCLUIDA')}
                        className="text-xs px-2 py-1 bg-green-950 text-green-400 border border-green-800 rounded hover:bg-green-900 transition-colors"
                      >
                        Concluir
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-white font-semibold">Nova tarefa</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Título *</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))}
                  placeholder="O que precisa ser feito?"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Descrição</label>
                <textarea
                  value={form.descricao}
                  onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Responsável *</label>
                  <select
                    value={form.responsavelId}
                    onChange={e => setForm(p => ({ ...p, responsavelId: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option value="">Selecione...</option>
                    {usuarios.map(u => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Prioridade</label>
                  <select
                    value={form.prioridade}
                    onChange={e => setForm(p => ({ ...p, prioridade: e.target.value as Prioridade }))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option value="SEM_PRAZO">Sem prazo</option>
                    <option value="HOJE">Hoje</option>
                    <option value="URGENTE">Urgente</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Prazo (opcional)</label>
                <input
                  type="datetime-local"
                  value={form.prazo}
                  onChange={e => setForm(p => ({ ...p, prazo: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <button
                onClick={criarTarefa}
                disabled={salvando || !form.titulo || !form.responsavelId}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black font-semibold rounded-lg text-sm"
              >
                {salvando ? 'Criando...' : 'Criar tarefa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
