import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate, calcularMargem } from '@/lib/utils'
import { TrendingUp, Package, ShoppingCart, Users } from 'lucide-react'

async function getRelatorios() {
  const hoje = new Date()
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  const inicioSemana = new Date(hoje)
  inicioSemana.setDate(hoje.getDate() - 7)

  const [vendasMes, vendasSemana, topProdutos, porFuncionario] = await Promise.all([
    prisma.venda.aggregate({
      where: { criadoEm: { gte: inicioMes } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.venda.aggregate({
      where: { criadoEm: { gte: inicioSemana } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.itemVenda.groupBy({
      by: ['produtoId'],
      _sum: { quantidade: true, subtotal: true },
      _count: true,
      orderBy: { _sum: { subtotal: 'desc' } },
      take: 10,
    }),
    prisma.venda.groupBy({
      by: ['usuarioId'],
      where: { criadoEm: { gte: inicioMes } },
      _sum: { total: true },
      _count: true,
    }),
  ])

  const produtosIds = topProdutos.map(p => p.produtoId)
  const produtos = await prisma.produto.findMany({
    where: { id: { in: produtosIds } },
    select: { id: true, nome: true, precoVenda: true, precoCusto: true, categoria: true }
  })
  const produtoMap = Object.fromEntries(produtos.map(p => [p.id, p]))

  const usuariosIds = porFuncionario.map(v => v.usuarioId)
  const usuarios = await prisma.usuario.findMany({
    where: { id: { in: usuariosIds } },
    select: { id: true, nome: true }
  })
  const usuarioMap = Object.fromEntries(usuarios.map(u => [u.id, u]))

  return {
    vendasMes,
    vendasSemana,
    topProdutos: topProdutos.map(tp => ({
      ...tp,
      produto: produtoMap[tp.produtoId],
    })).filter(tp => tp.produto),
    porFuncionario: porFuncionario.map(v => ({
      ...v,
      usuario: usuarioMap[v.usuarioId],
    })).filter(v => v.usuario),
  }
}

export default async function RelatoriosPage() {
  const session = await auth()
  if (!session) return null
  if (!['DONO', 'GERENTE'].includes(session.user.perfil)) redirect('/dashboard')

  const dados = await getRelatorios()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Relatórios</h1>
        <p className="text-zinc-500 text-sm">Análise de desempenho da operação</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: 'Faturamento no mês',
            value: formatCurrency(dados.vendasMes._sum.total || 0),
            sub: `${dados.vendasMes._count} vendas`,
            icon: TrendingUp,
            color: 'text-green-400',
            bg: 'bg-green-950'
          },
          {
            label: 'Faturamento na semana',
            value: formatCurrency(dados.vendasSemana._sum.total || 0),
            sub: `${dados.vendasSemana._count} vendas`,
            icon: ShoppingCart,
            color: 'text-blue-400',
            bg: 'bg-blue-950'
          },
          {
            label: 'Ticket médio (mês)',
            value: dados.vendasMes._count > 0
              ? formatCurrency((dados.vendasMes._sum.total || 0) / dados.vendasMes._count)
              : 'R$ 0,00',
            sub: 'Por venda',
            icon: Package,
            color: 'text-orange-400',
            bg: 'bg-orange-950'
          },
          {
            label: 'Vendedores ativos',
            value: dados.porFuncionario.length.toString(),
            sub: 'Este mês',
            icon: Users,
            color: 'text-purple-400',
            bg: 'bg-purple-950'
          },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className={`w-8 h-8 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <p className="text-white font-bold text-lg">{card.value}</p>
              <p className="text-zinc-500 text-xs">{card.label}</p>
              <p className="text-zinc-600 text-xs">{card.sub}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top produtos */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-white mb-4">Produtos mais vendidos</h2>
          <div className="space-y-2">
            {dados.topProdutos.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-6">Sem dados ainda</p>
            ) : (
              dados.topProdutos.map((tp, i) => {
                const margem = tp.produto.precoCusto
                  ? calcularMargem(tp.produto.precoVenda, tp.produto.precoCusto)
                  : null
                return (
                  <div key={tp.produtoId} className="flex items-center gap-3 py-2 border-b border-zinc-800 last:border-0">
                    <span className="text-zinc-600 text-xs w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{tp.produto.nome}</p>
                      <p className="text-zinc-500 text-xs">{tp._sum.quantidade} unidades</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white text-sm font-medium">{formatCurrency(tp._sum.subtotal || 0)}</p>
                      {margem !== null && (
                        <p className={`text-xs ${margem >= 30 ? 'text-green-400' : margem >= 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {margem.toFixed(1)}% margem
                        </p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Por funcionário */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-white mb-4">Vendas por funcionário (mês)</h2>
          <div className="space-y-3">
            {dados.porFuncionario.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-6">Sem dados ainda</p>
            ) : (
              dados.porFuncionario
                .sort((a, b) => (b._sum.total || 0) - (a._sum.total || 0))
                .map(v => {
                  const totalGeral = dados.vendasMes._sum.total || 1
                  const pct = ((v._sum.total || 0) / totalGeral) * 100
                  return (
                    <div key={v.usuarioId}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-white text-sm font-medium">{v.usuario.nome}</p>
                        <div className="text-right">
                          <span className="text-white text-sm font-medium">{formatCurrency(v._sum.total || 0)}</span>
                          <span className="text-zinc-500 text-xs ml-2">{v._count} vendas</span>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-800 rounded-full h-1.5">
                        <div
                          className="bg-orange-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
