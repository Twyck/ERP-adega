import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import {
  ShoppingCart, Package, CheckSquare,
  AlertTriangle, TrendingUp, Wine
} from 'lucide-react'

async function getDashboardStats(userId: string, perfil: string) {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)

  const [vendasHoje, produtosBaixoEstoque, tarefasPendentes, ocorrencias, totalHoje] =
    await Promise.all([
      prisma.venda.count({ where: { criadoEm: { gte: hoje } } }),
      prisma.produto.count({
        where: { ativo: true, estoqueAtual: { lte: prisma.produto.fields.estoqueMinimo } }
      }).catch(() => prisma.produto.findMany({
        where: { ativo: true },
        select: { estoqueAtual: true, estoqueMinimo: true }
      }).then(ps => ps.filter(p => p.estoqueAtual <= p.estoqueMinimo).length)),
      prisma.tarefa.count({
        where: {
          status: { in: ['PENDENTE', 'EM_ANDAMENTO'] },
          ...(perfil !== 'DONO' && perfil !== 'GERENTE' ? { responsavelId: userId } : {})
        }
      }),
      prisma.ocorrencia.count({ where: { criadoEm: { gte: hoje } } }),
      prisma.venda.aggregate({
        where: { criadoEm: { gte: hoje } },
        _sum: { total: true }
      }),
    ])

  return {
    vendasHoje,
    faturamentoHoje: totalHoje._sum.total || 0,
    produtosBaixoEstoque: typeof produtosBaixoEstoque === 'number' ? produtosBaixoEstoque : 0,
    tarefasPendentes,
    ocorrencias,
  }
}

async function getUltimasVendas() {
  return prisma.venda.findMany({
    take: 5,
    orderBy: { criadoEm: 'desc' },
    include: {
      usuario: { select: { nome: true } },
      itens: { include: { produto: { select: { nome: true } } } }
    }
  })
}

async function getProdutosEstoqueBaixo() {
  const produtos = await prisma.produto.findMany({
    where: { ativo: true },
    select: { id: true, nome: true, estoqueAtual: true, estoqueMinimo: true, categoria: true },
    orderBy: { estoqueAtual: 'asc' },
    take: 20
  })
  return produtos.filter(p => p.estoqueAtual <= p.estoqueMinimo).slice(0, 5)
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session) return null

  const [stats, ultimasVendas, estoqueBaixo] = await Promise.all([
    getDashboardStats(session.user.id, session.user.perfil),
    getUltimasVendas(),
    getProdutosEstoqueBaixo(),
  ])

  const cards = [
    {
      label: 'Vendas hoje',
      value: stats.vendasHoje.toString(),
      icon: ShoppingCart,
      color: 'text-blue-400',
      bg: 'bg-blue-950'
    },
    {
      label: 'Faturamento hoje',
      value: formatCurrency(stats.faturamentoHoje),
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-950',
      somente: ['DONO', 'GERENTE']
    },
    {
      label: 'Estoque baixo',
      value: stats.produtosBaixoEstoque.toString(),
      icon: Package,
      color: stats.produtosBaixoEstoque > 0 ? 'text-orange-400' : 'text-zinc-400',
      bg: stats.produtosBaixoEstoque > 0 ? 'bg-orange-950' : 'bg-zinc-900'
    },
    {
      label: 'Tarefas abertas',
      value: stats.tarefasPendentes.toString(),
      icon: CheckSquare,
      color: stats.tarefasPendentes > 0 ? 'text-yellow-400' : 'text-zinc-400',
      bg: stats.tarefasPendentes > 0 ? 'bg-yellow-950' : 'bg-zinc-900'
    },
    {
      label: 'Ocorrências hoje',
      value: stats.ocorrencias.toString(),
      icon: AlertTriangle,
      color: stats.ocorrencias > 0 ? 'text-red-400' : 'text-zinc-400',
      bg: stats.ocorrencias > 0 ? 'bg-red-950' : 'bg-zinc-900'
    },
  ]

  const cardsVisiveis = cards.filter(
    c => !c.somente || c.somente.includes(session.user.perfil)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-0.5">Visão geral da operação</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {cardsVisiveis.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className={`w-8 h-8 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{card.label}</p>
            </div>
          )
        })}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Últimas vendas */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-white mb-4">Últimas vendas</h2>
          {ultimasVendas.length === 0 ? (
            <div className="text-center py-8">
              <Wine className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-600 text-sm">Nenhuma venda hoje</p>
            </div>
          ) : (
            <div className="space-y-2">
              {ultimasVendas.map(venda => (
                <div key={venda.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">
                      {venda.itens.map(i => i.produto.nome).join(', ').substring(0, 40)}
                      {venda.itens.map(i => i.produto.nome).join(', ').length > 40 ? '...' : ''}
                    </p>
                    <p className="text-zinc-500 text-xs">{venda.usuario.nome}</p>
                  </div>
                  <span className="text-green-400 text-sm font-medium">
                    {formatCurrency(venda.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estoque baixo */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-white mb-4">Produtos com estoque baixo</h2>
          {estoqueBaixo.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-600 text-sm">Estoque em ordem</p>
            </div>
          ) : (
            <div className="space-y-2">
              {estoqueBaixo.map(produto => (
                <div key={produto.id} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                  <div>
                    <p className="text-white text-sm font-medium">{produto.nome}</p>
                    <p className="text-zinc-500 text-xs">{produto.categoria}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-orange-400 text-sm font-bold">{produto.estoqueAtual}</span>
                    <p className="text-zinc-600 text-xs">mín: {produto.estoqueMinimo}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
