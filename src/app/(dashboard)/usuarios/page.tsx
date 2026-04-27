import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatDate, PERFIL_LABELS } from '@/lib/utils'
import { Users } from 'lucide-react'
import { NovoUsuarioButton } from '@/components/modulos/NovoUsuarioButton'

const PERFIL_CORES: Record<string, string> = {
  DONO: 'text-orange-400 bg-orange-950 border-orange-800',
  GERENTE: 'text-blue-400 bg-blue-950 border-blue-800',
  ESTOQUISTA: 'text-green-400 bg-green-950 border-green-800',
  CAIXA: 'text-zinc-400 bg-zinc-800 border-zinc-700',
}

export default async function UsuariosPage() {
  const session = await auth()
  if (!session || session.user.perfil !== 'DONO') redirect('/dashboard')

  const usuarios = await prisma.usuario.findMany({
    orderBy: { criadoEm: 'desc' },
    select: {
      id: true, nome: true, email: true, perfil: true, ativo: true, criadoEm: true,
      _count: { select: { vendas: true, tarefasRecebidas: true } }
    }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Usuários</h1>
          <p className="text-zinc-500 text-sm">{usuarios.length} cadastrados</p>
        </div>
        <NovoUsuarioButton />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        {usuarios.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-zinc-700 mx-auto mb-2" />
            <p className="text-zinc-600 text-sm">Nenhum usuário cadastrado</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {usuarios.map(user => (
              <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-zinc-800/50">
                <div className="w-9 h-9 bg-zinc-800 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-bold">{user.nome[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium text-sm">{user.nome}</p>
                    {!user.ativo && (
                      <span className="text-xs text-zinc-600 border border-zinc-700 rounded px-1">Inativo</span>
                    )}
                  </div>
                  <p className="text-zinc-500 text-xs">{user.email}</p>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs text-zinc-500">
                  <span>{user._count.vendas} vendas</span>
                  <span>{user._count.tarefasRecebidas} tarefas</span>
                  <span>desde {formatDate(user.criadoEm)}</span>
                </div>
                <span className={`text-xs border rounded px-2 py-1 font-medium ${PERFIL_CORES[user.perfil]}`}>
                  {PERFIL_LABELS[user.perfil]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
