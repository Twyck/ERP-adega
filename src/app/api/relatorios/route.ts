import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['DONO', 'GERENTE'].includes(session.user.perfil)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const periodo = searchParams.get('periodo') || 'mes'

  const hoje = new Date()
  let inicio: Date

  switch (periodo) {
    case 'semana':
      inicio = new Date(hoje)
      inicio.setDate(hoje.getDate() - 7)
      break
    case 'mes':
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      break
    case 'ano':
      inicio = new Date(hoje.getFullYear(), 0, 1)
      break
    default:
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  }

  const [vendas, topProdutos, porFormaPagamento] = await Promise.all([
    prisma.venda.findMany({
      where: { criadoEm: { gte: inicio } },
      include: { itens: true },
      orderBy: { criadoEm: 'asc' },
    }),
    prisma.itemVenda.groupBy({
      by: ['produtoId'],
      where: { venda: { criadoEm: { gte: inicio } } },
      _sum: { quantidade: true, subtotal: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: 10,
    }),
    prisma.venda.groupBy({
      by: ['tipoPagamento'],
      where: { criadoEm: { gte: inicio } },
      _sum: { total: true },
      _count: true,
    }),
  ])

  const totalFaturamento = vendas.reduce((s, v) => s + v.total, 0)
  const totalVendas = vendas.length
  const ticketMedio = totalVendas > 0 ? totalFaturamento / totalVendas : 0

  return NextResponse.json({
    resumo: { totalFaturamento, totalVendas, ticketMedio },
    topProdutos,
    porFormaPagamento,
    periodo,
  })
}
