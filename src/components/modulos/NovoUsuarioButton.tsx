'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

const PERFIS = [
  { value: 'CAIXA', label: 'Caixa' },
  { value: 'ESTOQUISTA', label: 'Estoquista' },
  { value: 'GERENTE', label: 'Gerente' },
  { value: 'DONO', label: 'Dono' },
]

export function NovoUsuarioButton() {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', senha: '', perfil: 'CAIXA' })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  async function criar() {
    if (!form.nome || !form.email || !form.senha) return
    setSalvando(true)
    setErro('')
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setSalvando(false)
    if (res.ok) {
      setShowModal(false)
      setForm({ nome: '', email: '', senha: '', perfil: 'CAIXA' })
      router.refresh()
    } else {
      setErro(data.error || 'Erro ao criar usuário')
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-black font-semibold rounded-lg text-sm"
      >
        <Plus className="w-4 h-4" /> Novo usuário
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <h2 className="text-white font-semibold">Novo usuário</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-white">✕</button>
            </div>
            <div className="p-4 space-y-4">
              {[
                { label: 'Nome completo *', key: 'nome', type: 'text' },
                { label: 'Email *', key: 'email', type: 'email' },
                { label: 'Senha *', key: 'senha', type: 'password' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs text-zinc-400 block mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Perfil</label>
                <select
                  value={form.perfil}
                  onChange={e => setForm(p => ({ ...p, perfil: e.target.value }))}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500"
                >
                  {PERFIS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              {erro && <p className="text-red-400 text-sm">{erro}</p>}
              <button
                onClick={criar}
                disabled={salvando || !form.nome || !form.email || !form.senha}
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-black font-semibold rounded-lg text-sm"
              >
                {salvando ? 'Criando...' : 'Criar usuário'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
